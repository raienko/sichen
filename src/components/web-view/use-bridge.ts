import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useResponsive } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import {
  decodeMessage,
  encodeMessage,
  isAllowedOrigin,
  originOf,
} from "./bridge";
import { READY_MESSAGE, STYLE_MESSAGE } from "./injection";
import { buildThemeCss } from "./theme-css";
import type { BridgeMessage, WebViewProps, WebViewSource } from "./types";

/**
 * Everything the two implementations agree on, in one place: which origins
 * are trusted, what stylesheet to send, how an incoming message is checked,
 * and the queue that makes `post` safe to call before the page is up.
 *
 * They differ only in transport — `injectJavaScript` against a native view,
 * `contentWindow.postMessage` against an iframe — so the transport is the
 * one thing this asks for and everything else lives here. Two copies of the
 * origin check is exactly the kind of duplication that ends with the web
 * one quietly missing a rule.
 */
export function useBridge({
  source,
  allowedOrigins,
  css,
  injectTheme = true,
  onMessage,
  onReady,
  send,
  localOrigins,
}: Pick<
  WebViewProps,
  "source" | "allowedOrigins" | "css" | "injectTheme" | "onMessage" | "onReady"
> & {
  /** Hands one encoded envelope to the page. Platform-specific. */
  send: (encoded: string) => void;
  /**
   * What counts as "a document this app wrote", which is not the same
   * answer on both platforms and cannot be worked out from here.
   *
   * Native loads an `html` source as `about:blank`, which has no origin at
   * all. A browser renders it from `srcdoc`, and because the frame carries
   * `allow-same-origin` it *inherits the app's own origin* rather than
   * getting an opaque one — so on the web the app's origin has to count
   * too, or the app's own documents are dropped as third parties. Found
   * exactly that way: the handshake never arrived in the browser.
   */
  localOrigins: readonly string[];
}) {
  const theme = useTheme();
  const { typography } = useResponsive();

  const [ready, setReady] = useState(false);
  // A queue rather than a dropped message: a caller reacting to `onLoad`,
  // or simply rendering with data already in hand, posts before the page's
  // own scripts have run. Losing those silently is the kind of bug that
  // only shows up on a slow connection.
  const pending = useRef<string[]>([]);

  const origins = useMemo(
    () => resolveOrigins(source, allowedOrigins, localOrigins),
    [source, allowedOrigins, localOrigins],
  );

  const stylesheet = useMemo(() => {
    const themed = injectTheme ? buildThemeCss(theme.colors, typography) : "";
    return [themed, css].filter(Boolean).join("\n\n");
  }, [injectTheme, theme.colors, typography, css]);

  // The value the document is built with, captured once. The live one is
  // delivered over the bridge instead: rebuilding `srcdoc` (or the native
  // injection) for a changed stylesheet would reload the page under the
  // user, which is a lot to pay for a colour.
  // `useState` rather than a ref, because this is read during render and a
  // ref read there is exactly what React's own lint rule forbids.
  const [initialStylesheet] = useState(stylesheet);

  /**
   * The last sheet the page was actually given, so a change can be told
   * from a re-render. It has to be what was *sent* rather than what the
   * document started with: turning a stylesheet off and back on again
   * returns it to the initial value, and comparing against that would
   * decide nothing had changed and leave the page unstyled.
   */
  const sentStylesheet = useRef<string | null>(null);

  const sendStylesheet = useCallback(() => {
    if (stylesheet === sentStylesheet.current) return;
    sentStylesheet.current = stylesheet;
    send(encodeMessage({ type: STYLE_MESSAGE, payload: stylesheet }));
  }, [stylesheet, send]);

  const post = useCallback(
    (type: string, payload?: unknown) => {
      const encoded = encodeMessage({ type, payload });
      if (ready) send(encoded);
      else pending.current.push(encoded);
    },
    [ready, send],
  );

  /**
   * Handles one raw message from the page. Returns whether it was ours, so
   * a caller can tell "not for us" from "rejected", which are different
   * things worth being able to see in a test.
   */
  const receive = useCallback(
    (raw: unknown, origin: string): boolean => {
      if (!isAllowedOrigin(origin, origins)) return false;

      const message = decodeMessage(raw);
      if (message === null) return false;

      if (message.type === READY_MESSAGE) {
        setReady(true);
        // Whatever the caller sent while the page was still loading, in the
        // order they sent it, before anything that follows.
        const queued = pending.current;
        pending.current = [];
        queued.forEach(send);
        // A fresh document only carries `initialStylesheet`; this brings it
        // up to whatever the sheet is now, and records what it was given.
        sendStylesheet();
        onReady?.();
        return true;
      }

      onMessage?.(message);
      return true;
    },
    [origins, onMessage, onReady, send, sendStylesheet],
  );

  // A stylesheet driven by state — a scheme change, a toggled prop —
  // reaches a page that is already up, without rebuilding the document.
  useEffect(() => {
    if (ready) sendStylesheet();
  }, [ready, sendStylesheet]);

  const reset = useCallback(() => {
    setReady(false);
    // The next document starts from `initialStylesheet` again, so what the
    // last one was given no longer says anything about this one.
    sentStylesheet.current = null;
  }, []);

  return {
    origins,
    stylesheet,
    initialStylesheet,
    ready,
    post,
    receive,
    reset,
  };
}

/**
 * Which origins to trust, defaulting to the one we asked for.
 *
 * A page that redirects somewhere else does not inherit that trust: the
 * shim goes wherever the view navigates, so without this a redirect to
 * another site would leave it talking to the app under the same listener.
 */
function resolveOrigins(
  source: WebViewSource,
  allowedOrigins: string[] | undefined,
  localOrigins: readonly string[],
): string[] {
  if (allowedOrigins !== undefined) return allowedOrigins;

  if ("uri" in source) {
    const origin = originOf(source.uri);
    // A relative URL has no origin to read and is same-origin by
    // definition, so it gets the same trust an `html` source does.
    return origin === null ? [...localOrigins] : [origin];
  }

  // A document the app wrote. Naming the origins it can legitimately have
  // rather than trusting everything is what makes an `html` document that
  // navigates to a real site stop being heard.
  return [...localOrigins];
}

export type Bridge = ReturnType<typeof useBridge>;
export type { BridgeMessage };
