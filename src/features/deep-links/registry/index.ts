import { openURL } from "expo-linking";
import { router, type Href } from "expo-router";

import { createEventBus } from "@/features/event-bus";
import logger from "@/features/logger";
import { isWeb } from "@/utils";

import { matchPath } from "../match";
import DeepLinkQueue from "../queue";
import staticRoutes from "../routes";
import {
  READY_GATE,
  type DeepLink,
  type DeepLinkGate,
  type DeepLinkRoute,
} from "../types";
import { normalizeUrl, type NormalizedUrl } from "../url";

type Match = {
  link: DeepLink;
  route: DeepLinkRoute;
};

/** A match plus every gate it has to clear, the built-in `ready` included. */
type GatedMatch = Match & { gates: DeepLinkGate[] };

export type DeepLinkEvents = {
  /** A link whose handler has just run. */
  handled: DeepLink;
  /** A link parked until the gates it still needs are open. */
  deferred: { link: DeepLink; gates: DeepLinkGate[] };
};

/**
 * What the pipeline did with each link, for anything that wants to watch
 * rather than handle: analytics counting deep-link opens, a debug screen,
 * a UI showing what is still waiting on a gate.
 *
 * A bus rather than a callback prop or a context because a link is
 * dispatched outside React and outside any one screen — the same reason
 * `Modal`'s show/hide is built on one.
 */
export const deepLinkEvents = createEventBus<DeepLinkEvents>();

/**
 * The one place a link is turned into an action, whatever raised it — the
 * OS at launch, the OS while the app runs, a tapped push notification, a
 * toast's action, an in-app banner.
 *
 * Two entry points, one pipeline behind them:
 * - `receive()` is called by `<DeepLinks>` (./deep-links.tsx) for every URL
 *   the OS delivers, launch URL included.
 * - `open()` is called by app code for a link it produced itself.
 *
 * Both normalize the URL (./url.ts), match it against the route table
 * (./routes.ts + `register`), and dispatch it — immediately if the route's
 * gates are open, otherwise onto the queue (./queue.ts) until they are.
 * They differ only in what happens to a path no route claims; see each.
 *
 * A single instance, not a context: links arrive before React mounts (a
 * cold start *is* a deep link) and from places with no component around
 * them, so the pipeline can't be something you have to be inside the tree
 * to reach. Same reasoning as `permissions`.
 */
class DeepLinks {
  private routes: DeepLinkRoute[] = [...staticRoutes];
  private readonly gates = new Set<DeepLinkGate>();
  private readonly queue = new DeepLinkQueue();
  private readonly receivedInitialUrls = new Set<string>();

  /**
   * Adds a route at runtime, for links owned by a feature rather than by
   * the app as a whole. Returns a function that removes it again.
   *
   * Prefer ./routes.ts for anything permanent — a table read top to bottom
   * is what makes "where is this link handled?" answerable in one place.
   */
  register(route: DeepLinkRoute): () => void {
    const existing = this.routes.findIndex(
      (candidate) => candidate.pattern === route.pattern,
    );

    if (existing !== -1) {
      logger.warn(
        `Deep links: "${route.pattern}" is already registered — replacing it. ` +
          `Two handlers for one pattern would mean only the first ever ran.`,
      );
      this.routes.splice(existing, 1);
    }

    this.routes.push(route);

    return () => {
      this.routes = this.routes.filter((candidate) => candidate !== route);
    };
  }

  /** Every registered pattern, in match order. */
  patterns(): string[] {
    return this.routes.map((route) => route.pattern);
  }

  isGateOpen(gate: DeepLinkGate): boolean {
    return this.gates.has(gate);
  }

  /** Links waiting on a closed gate, oldest first. */
  pending(): readonly { link: DeepLink; gates: DeepLinkGate[] }[] {
    return this.queue.list();
  }

  /** Whether this registry, rather than Expo Router, owns an incoming URL. */
  claims(url: string): boolean {
    const normalized = normalizeUrl(url);
    return normalized !== null && this.match(normalized, false) !== null;
  }

  /**
   * Opens or closes a gate. Opening one dispatches everything that was only
   * waiting on it — so `deepLinks.setGate("auth", true)` right after a
   * sign-in is what makes a link tapped on the login screen finally run.
   */
  setGate(gate: DeepLinkGate, isOpen: boolean): void {
    if (isOpen === this.gates.has(gate)) return;

    if (!isOpen) {
      this.gates.delete(gate);
      return;
    }

    this.gates.add(gate);

    for (const entry of this.queue.release((candidate) =>
      this.gates.has(candidate),
    )) {
      void this.dispatch(entry);
    }
  }

  /**
   * Handles a URL the OS delivered — the launch URL, or one that arrived
   * while the app was running. Wired up in ./deep-links.tsx.
   *
   * A path no route claims is left alone here, unlike in `open()`. Expo
   * Router owns those ordinary file-based URLs. Registered native commands
   * are suppressed in ./native-intent.ts before this method dispatches them,
   * so a handler returning an href is the command's only navigation.
   *
   * `initial` says whether this URL is what launched the app, and reaches
   * handlers as `link.initial`.
   */
  async receive(url: string, initial: boolean): Promise<void> {
    const initialKey = url.trim();

    // Expo exposes the launch URL through both a synchronous cache and RN's
    // async reader. It can also survive a development remount. A cold-start
    // intent belongs to this process once, even if more than one reader sees
    // it; warm URL events remain intentionally repeatable.
    if (initial && this.receivedInitialUrls.has(initialKey)) return;
    if (initial) this.receivedInitialUrls.add(initialKey);

    try {
      const normalized = normalizeUrl(url);
      const match = normalized && this.match(normalized, initial);
      if (!match) return;

      await this.dispatch(withGates(match));
    } catch (error) {
      logger.failed(`Unable to handle deep link "${url}"`, error);
    }
  }

  /**
   * Handles a URL the app raised itself: a tapped push notification, a
   * toast action, a banner. Runs the same handlers as an OS link, and
   * defers on the same gates.
   *
   * Nothing else is routing these, so unlike `receive()` a path no route
   * claims is navigated to here, leaving Expo Router to resolve it by file.
   *
   * A URL that isn't ours — another app's scheme, a website on a domain
   * outside `EXPO_PUBLIC_APP_LINK_DOMAINS` — is handed to the OS instead,
   * so one call site can take any link at all and doesn't need to know
   * beforehand whether it points inside the app.
   */
  async open(url: string): Promise<void> {
    try {
      const normalized = normalizeUrl(url);

      if (!normalized) {
        await openExternal(url);
        return;
      }

      await this.dispatch(
        withGates(this.match(normalized, false) ?? fallback(normalized)),
      );
    } catch (error) {
      logger.failed(`Unable to open deep link "${url}"`, error);
    }
  }

  /**
   * Drops every runtime registration, gate and queued link, leaving the
   * static table from ./routes.ts. For tests, which share this instance.
   */
  reset(): void {
    this.routes = [...staticRoutes];
    this.gates.clear();
    this.queue.clear();
    this.receivedInitialUrls.clear();
  }

  /** First pattern that matches wins, which is why order is priority. */
  private match(normalized: NormalizedUrl, initial: boolean): Match | null {
    for (const route of this.routes) {
      const params = matchPath(route.pattern, normalized.path);
      if (params) return { route, link: { ...normalized, params, initial } };
    }

    return null;
  }

  private async dispatch({ link, route, gates }: GatedMatch): Promise<void> {
    const closed = gates.filter((gate) => !this.gates.has(gate));

    if (closed.length > 0) {
      logger.log(
        `Deep link "${link.url}" is waiting for: ${closed.join(", ")}`,
        link,
      );
      this.queue.add({ link, route, gates });
      deepLinkEvents.emit("deferred", { link, gates: closed });
      return;
    }

    try {
      const href = await route.handle(link);
      if (href) router.navigate(href);
      deepLinkEvents.emit("handled", link);
    } catch (error) {
      logger.failed(`Deep link "${link.url}" failed to handle`, error);
    }
  }
}

function withGates(match: Match): GatedMatch {
  return { ...match, gates: [READY_GATE, ...(match.route.gates ?? [])] };
}

/**
 * What an unregistered path does when it arrives through `open()`: navigate
 * to it and let Expo Router resolve it by file. `receive()` needs no
 * equivalent — the router is already doing this for OS URLs.
 *
 * It still goes through `dispatch`, so it waits for `ready` like everything
 * else — a push tapped during a cold start can't navigate before the
 * navigator exists.
 */
/**
 * Hands a link that isn't the app's to whatever opens it. On the web,
 * `expo-linking` navigates the current tab, so a web address tapped in a
 * chat message or a Markdown block replaced the whole app; it opens in a
 * new tab instead, without giving that page a handle back on this one.
 * `mailto:` and `tel:` still go through `openURL`, which hands them to
 * the mail or phone app without leaving the page.
 */
async function openExternal(url: string): Promise<void> {
  if (isWeb && /^https?:\/\//i.test(url)) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  await openURL(url);
}

function fallback(normalized: NormalizedUrl): Match {
  return {
    link: { ...normalized, params: {}, initial: false },
    route: {
      pattern: normalized.path,
      // Safe despite typed routes: an unregistered path is by definition
      // one this table never named, so there's no literal to check it
      // against. Expo Router falls back to +not-found if it isn't real.
      handle: (link) => {
        const params = Object.fromEntries(
          Object.entries(link.query).filter(([, value]) => value !== undefined),
        );

        return Object.keys(params).length === 0
          ? (link.path as Href)
          : ({ pathname: link.path, params } as Href);
      },
    },
  };
}

const deepLinks = new DeepLinks();

export default deepLinks;
