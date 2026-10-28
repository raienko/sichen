import {
  addEventListener,
  clearInitialURL,
  getInitialURL,
  getLinkingURL,
} from "expo-linking";
import { useNavigationContainerRef } from "expo-router";
import { useEffect, type ReactNode } from "react";

import logger from "@/features/logger";

import deepLinks from "./registry";
import { READY_GATE } from "./types";

type Props = {
  children: ReactNode;
};

/**
 * The app's one subscription to incoming links, and the only place that
 * reads the URL the app was launched with.
 *
 * Lifecycle only. The links themselves live in the `deepLinks` singleton,
 * so nothing has to be inside this component (or any context) to dispatch
 * or handle one — the same split `Permissions` has.
 *
 * Expo Router keeps a `Linking` subscription of its own. The app-level
 * +native-intent entry asks ./native-intent.ts whether this feature claims a
 * URL: registered commands return `null`, preventing Router from navigating
 * before their gates open; ordinary file-based routes pass through. This
 * listener performs the command side of that handshake. On web, where
 * +native-intent does not run, Router owns the URL and this listener only
 * adds registered side effects.
 *
 * Testing the launch URL needs a release or preview build. In a development
 * build, a cold start from a custom-scheme URL lands in expo-dev-client's
 * own launcher instead of the app, so no JS runs to read it; the URL is
 * replayed only once you pick the dev server by hand.
 */
export default function DeepLinks({ children }: Props) {
  // Typed as always present, but it's read off Expo Router's global store,
  // which only exists inside a mounted <ExpoRoot> — so it really is missing
  // when this component is rendered on its own (a test, a story). No
  // navigator means not ready, which is the honest answer, not a crash.
  const navigationRef = useNavigationContainerRef() as
    ReturnType<typeof useNavigationContainerRef> | undefined;

  useEffect(() => {
    if (!navigationRef) return;

    const openWhenReady = () => {
      if (!navigationRef.isReady()) return false;
      deepLinks.setGate(READY_GATE, true);
      return true;
    };

    // Children mount before this effect runs, so by now the root layout has
    // rendered its navigator and this is almost always already true. The
    // listener covers the case where it isn't — a navigator that only
    // appears after an async first render, say — rather than assuming.
    const unsubscribe = openWhenReady()
      ? undefined
      : navigationRef.addListener("state", openWhenReady);

    return () => {
      unsubscribe?.();
      deepLinks.setGate(READY_GATE, false);
    };
  }, [navigationRef]);

  useEffect(() => {
    let mounted = true;
    const urlsReceivedWhileReadingInitial = new Set<string>();

    // Subscribed to before the launch URL is read, so a link that arrives
    // while that promise is in flight is still seen.
    const subscription = addEventListener("url", ({ url }) => {
      urlsReceivedWhileReadingInitial.add(url.trim());
      void deepLinks.receive(url, false);
    });

    // `addEventListener` never fires for the URL that started the app —
    // that one was delivered before any JS ran, and is only readable by
    // asking for it. Handlers get it as `initial: true`.
    //
    // Two readers, because neither covers both platforms on its own, and
    // this is the same split Expo Router makes internally: `getLinkingURL`
    // is Expo's own (synchronous) reader and the one it trusts on iOS,
    // where RN's `getInitialURL` misses launches it should see — App
    // Clips, handoff, and a development build's own launch. On Android
    // Expo Router still goes through RN's, so that's the fallback.
    const launchUrl = getLinkingURL();

    if (launchUrl) {
      // Native caches this value across remounts. Expo Router has already read
      // it by the time this provider effect runs, so it is safe to clear now.
      clearInitialURL();
      void deepLinks.receive(launchUrl, true);
    } else {
      getInitialURL()
        .then((url) => {
          if (
            mounted &&
            url &&
            !urlsReceivedWhileReadingInitial.has(url.trim())
          ) {
            return deepLinks.receive(url, true);
          }
        })
        .catch((error) =>
          logger.failed("Unable to read the launch URL", error),
        );
    }

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return <>{children}</>;
}
