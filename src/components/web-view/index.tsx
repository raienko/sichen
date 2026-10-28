import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { Linking, View } from "react-native";
import RNWebView, {
  type WebViewMessageEvent,
  type WebViewNavigation,
} from "react-native-webview";

import { disabledA11yProps, imageA11yProps } from "@/features/accessibility";
import logger from "@/features/logger";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import { navigationDecision, OPAQUE_ORIGIN, originOf } from "./bridge";
import { deliverInjection, htmlWithBridge, nativeInjection } from "./injection";
import type { WebViewHandle, WebViewProps } from "./types";
import { useBridge } from "./use-bridge";

export type {
  BridgeMessage,
  WebViewHandle,
  WebViewProps,
  WebViewSource,
} from "./types";
export { BRIDGE_GLOBAL, BRIDGE_CHANNEL } from "./bridge";
export { bridgeScript } from "./injection";
export { buildThemeCss } from "./theme-css";

/**
 * Someone else's web page, embedded, with a two-way event bridge and the
 * app's own typography pushed into it.
 *
 * ```tsx
 * const web = useRef<WebViewHandle>(null);
 *
 * <WebView
 *   ref={web}
 *   label="Checkout"
 *   source={{ uri: "https://pay.example.com/session/12" }}
 *   onMessage={({ type, payload }) => {
 *     if (type === "checkout.complete") finish(payload);
 *   }}
 * />
 *
 * web.current?.post("cart.updated", cart);
 * ```
 *
 * **The page gets one API on both platforms.** A shim is injected before
 * the page's own scripts run, publishing `window.AppBridge` with `post` and
 * `on`; it picks `window.ReactNativeWebView` here and `window.parent` in
 * the browser, so a page written once works in both. `bridgeScript()` is
 * exported for the case the shim can't be injected — see the matrix below.
 *
 * **Only the origin you loaded is listened to.** `allowedOrigins` defaults
 * to the origin of `source.uri`, and messages from anywhere else are
 * dropped: the shim travels with the view, so a page that redirects
 * elsewhere would otherwise be talking to your `onMessage` from a site you
 * never named. Everything arriving is untrusted data — it is JSON-parsed
 * behind a length cap and never evaluated.
 *
 * **It only navigates where it listens.** The same origins decide where
 * the view may go: a link to another http(s) site opens in the system
 * browser, and any other scheme (`javascript:`, `file:`, `intent:`, an
 * app's custom scheme) is refused. File access and new windows are off.
 *
 * **`post` is safe to call before the page is up.** Messages sent before
 * the shim announces itself are queued and flushed in order, so a caller
 * with data already in hand doesn't have to wait for `onReady`.
 *
 * **What works where.** Native can inject into any page it loads, so the
 * bridge and the CSS both work against a third party. The browser cannot
 * script a cross-origin `iframe` at all — no exception, no workaround — so
 * there a third-party page must include `bridgeScript()` itself, and
 * receives its stylesheet over the bridge like any other message. Same
 * origin, and any `html` source, work fully on both.
 *
 * | | native | web, same origin or `html` | web, cross-origin |
 * | --- | --- | --- | --- |
 * | bridge | injected | injected | page includes `bridgeScript()` |
 * | CSS | injected | injected | over the bridge, once it is there |
 *
 * @example <WebView label="Help" source={{ uri: "https://example.com/help" }} />
 * @example <WebView label="Receipt" source={{ html }} css=".total { font-weight: 600 }" />
 */
/** Stable, so it can be a dependency without re-resolving every render. */
const NATIVE_LOCAL_ORIGINS = [OPAQUE_ORIGIN];
/** Hands every navigation to `handleShouldStartLoad`; see the prop. */
const ALL_ORIGINS = ["*"];

const WebView = forwardRef<WebViewHandle, WebViewProps>(function WebView(
  {
    source,
    label,
    allowedOrigins,
    onMessage,
    css,
    injectTheme = true,
    zoomable = false,
    onReady,
    onLoad,
    onError,
    style,
    testID,
  },
  ref,
) {
  const theme = useTheme();
  const styles = useStyles();
  const view = useRef<RNWebView>(null);

  const send = useCallback((encoded: string) => {
    view.current?.injectJavaScript(deliverInjection(encoded));
  }, []);

  const bridge = useBridge({
    source,
    allowedOrigins,
    // An `html` source loads as `about:blank` here, which parses to no
    // origin at all — see the fallback in `handleMessage`.
    localOrigins: NATIVE_LOCAL_ORIGINS,
    css,
    injectTheme,
    onMessage,
    onReady,
    send,
  });

  useImperativeHandle(
    ref,
    () => ({
      post: bridge.post,
      reload: () => view.current?.reload(),
    }),
    [bridge.post],
  );

  // An `html` source carries the shim at the top of the document itself,
  // the way the web build does. `injectedJavaScriptBeforeContentLoaded`
  // alone isn't enough there: on Android it runs from `onPageStarted`,
  // which can lose the race against the document's inline scripts, so a
  // page calling `AppBridge.on(...)` while it parses threw, never
  // registered, and every message from the app went nowhere — while the
  // page's own `post`, called later from a tap, kept working. The injected
  // copy stays for `uri` pages; whichever copy runs second is a no-op.
  // `initialStylesheet` is fixed at mount, so this never reloads the page.
  const nativeSource = useMemo(
    () =>
      "html" in source && typeof source.html === "string"
        ? {
            ...source,
            html: htmlWithBridge(source.html, bridge.initialStylesheet, {
              lockZoom: !zoomable,
            }),
          }
        : source,
    [source, bridge.initialStylesheet, zoomable],
  );

  function handleMessage(event: WebViewMessageEvent) {
    // The event carries the URL the message came from, which is what the
    // origin check has to be run against — not the URL we asked for, since
    // the page may have navigated since.
    //
    // A URL with no origin to parse is `about:blank`, which is what an
    // `html` source loads as. Falling back to the opaque origin rather than
    // to nothing is what makes those documents heard: they are ours, and
    // `resolveOrigins` names exactly that case.
    const origin = originOf(event.nativeEvent.url) ?? OPAQUE_ORIGIN;
    bridge.receive(event.nativeEvent.data, origin);
  }

  function handleShouldStartLoad(
    // The library's own type for this isn't exported from its entry point.
    request: WebViewNavigation & { isTopFrame?: boolean },
  ): boolean {
    // iOS asks for every frame. An iframe inside an allowed page — a video,
    // a payment step — is that page's business, and it can't reach the
    // bridge: messages are checked against the top document's URL.
    if (request.isTopFrame === false) return true;

    const decision = navigationDecision(request.url, bridge.origins);
    if (decision === "external") {
      Linking.openURL(request.url).catch((error: unknown) =>
        logger.failed(`WebView couldn't open "${request.url}"`, error),
      );
    }
    return decision === "allow";
  }

  function handleNavigation(event: WebViewNavigation) {
    // A new document means a new shim, which has not announced itself yet.
    // Without this, `post` would keep injecting into a page that has gone.
    if (event.loading) bridge.reset();
  }

  return (
    <View
      testID={testID}
      // The frame is named; what is inside it is the page's own business
      // and announces itself.
      {...imageA11yProps({ label })}
      style={[styles.frame, style]}
    >
      <RNWebView
        ref={view}
        {...disabledA11yProps()}
        source={nativeSource}
        // Every URL goes to `handleShouldStartLoad`, which checks exact
        // origins. The library's own list is a prefix match
        // (`https://example.com` passes `https://example.com.evil.net`) and
        // hands anything off-list to `Linking`, custom schemes included.
        originWhitelist={ALL_ORIGINS}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        // Android: no file:// pages, no file:// reaching other origins, and
        // `target="_blank"` stays in this view, where the check above runs.
        allowFileAccess={false}
        allowFileAccessFromFileURLs={false}
        allowUniversalAccessFromFileURLs={false}
        setSupportMultipleWindows={false}
        // iOS: `window.open` without a tap isn't honoured.
        javaScriptCanOpenWindowsAutomatically={false}
        // Before the page's own scripts, so `AppBridge` is already there
        // when they look for it — and so the stylesheet lands with the
        // first paint rather than after a flash of the page's own.
        injectedJavaScriptBeforeContentLoaded={nativeInjection(
          bridge.initialStylesheet,
          { lockZoom: !zoomable },
        )}
        // Android's pinch; the injected viewport covers its double tap and
        // all of iOS, which has no prop for either. See `zoomLockScript`.
        setBuiltInZoomControls={zoomable}
        onMessage={handleMessage}
        onNavigationStateChange={handleNavigation}
        onLoadEnd={onLoad}
        onError={({ nativeEvent }) => {
          const description = nativeEvent.description ?? "Unknown error";
          logger.failed(`WebView failed to load "${label}"`, description);
          onError?.(description);
        }}
        // Otherwise the view paints white until the page's own background
        // arrives, which in the dark scheme is a flash of the wrong colour.
        style={[styles.web, { backgroundColor: theme.colors.background }]}
        containerStyle={styles.web}
      />
    </View>
  );
});

export default WebView;

const useStyles = createStyles(() => ({
  frame: {
    // Fills whatever contains it: a web view stands in for a region of the
    // screen, and the caller's `style` is what decides how big that is.
    flex: 1,
    overflow: "hidden",
  },
  web: {
    flex: 1,
  },
}));
