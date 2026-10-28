import type { StyleProp, ViewStyle } from "react-native";

import type { BridgeMessage } from "./bridge";

export type { BridgeMessage };

/** What to load: a URL, or a document the app already has. */
export type WebViewSource = { uri: string } | { html: string };

/**
 * The imperative half of the bridge, for the app to talk into the page.
 * Reached through a ref, because "send this now" is an event rather than a
 * value — the same reason `Modal` exposes one.
 */
export type WebViewHandle = {
  /**
   * Sends an event into the page, where `AppBridge.on(type, …)` receives
   * it. Silently does nothing until the page's bridge has announced itself:
   * a message posted into a document that isn't listening yet is lost, so
   * anything sent early is queued and flushed on ready.
   */
  post: (type: string, payload?: unknown) => void;
  reload: () => void;
};

export type WebViewProps = {
  source: WebViewSource;
  /**
   * What a screen reader announces. Required: a web view is a rectangle of
   * someone else's content with no name of its own, and what is inside it
   * is not something the app can summarise.
   */
  label: string;
  /**
   * The origins whose messages are listened to — `["https://example.com"]`.
   * Exact origins, no wildcard hosts; see `isAllowedOrigin`.
   *
   * Defaults to the origin of `source.uri`, which is the answer nearly
   * every caller wants: talk to the page you loaded, and to nothing it
   * happened to navigate or redirect to. An `html` source needs none — the
   * app wrote that document.
   */
  allowedOrigins?: string[];
  /** Fires for every message the page posts that passes the origin check. */
  onMessage?: (message: BridgeMessage) => void;
  /**
   * CSS injected into the page, on top of whatever `injectTheme` adds.
   * Re-delivered when it changes, so it can be driven by state.
   */
  css?: string;
  /**
   * Injects the app's palette and type scale as custom properties plus a
   * shallow set of base rules, so the page reads as part of the app and
   * follows a scheme change. Defaults to `true`.
   */
  injectTheme?: boolean;
  /**
   * Whether the page can be pinch- or double-tap-zoomed. Defaults to
   * `false`: an embedded page stands in for part of the app's own screen,
   * and a stray double tap that blows it up past the frame (with nothing to
   * say how to get back) reads as a broken screen rather than a feature.
   *
   * Turn it on for anything people may need to read closely — a document,
   * small print, a page that isn't laid out for a phone. Pinch is how
   * someone with low vision gets there, and this takes it away.
   *
   * Native only, plus an `html` or same-origin page on the web. A browser
   * zooms the whole page around a cross-origin frame, and that is the
   * browser's to decide.
   */
  zoomable?: boolean;
  /** Fires once the page's bridge is listening — the point `post` starts working. */
  onReady?: () => void;
  onLoad?: () => void;
  onError?: (message: string) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};
