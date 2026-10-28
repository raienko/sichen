import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { View } from "react-native";

import { imageA11yProps } from "@/features/accessibility";
import logger from "@/features/logger";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import { OPAQUE_ORIGIN, postTargets } from "./bridge";
import { bridgeScript, htmlWithBridge, zoomLockScript } from "./injection";
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
 * The browser's answer to the native `WebView` — an `<iframe>` with the
 * same props, the same bridge and the same stylesheet.
 *
 * See ./index.tsx for the component's own documentation; this file exists
 * because `react-native-webview` has no web implementation, and the
 * community shim for it is a thin `iframe` wrapper with a smaller API than
 * this needs. Owning the twenty lines of `iframe` is a better trade than a
 * second dependency to keep the bridge working across.
 *
 * **The one real difference is not ours to fix.** A browser will not let a
 * page script a cross-origin frame — no injected shim, no injected
 * stylesheet, no exception. So a third-party page reached by `uri` has to
 * include `bridgeScript()` itself, and once it does, everything else works
 * as on native: it receives its stylesheet over the bridge like any other
 * message. Same-origin frames and `html` sources are scripted directly and
 * behave exactly as native does.
 */
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
  const frame = useRef<HTMLIFrameElement | null>(null);

  // Where outgoing messages may go — the trusted origins, read through a
  // ref because `send` is handed to the bridge that works them out.
  const targets = useRef<string[]>([]);

  const send = useCallback((encoded: string) => {
    // Never "*": the frame may have navigated somewhere else since it was
    // trusted, and only a named target origin makes the browser check.
    const target = frame.current?.contentWindow;
    if (!target) return;
    for (const origin of targets.current) target.postMessage(encoded, origin);
  }, []);

  const bridge = useBridge({
    source,
    allowedOrigins,
    localOrigins: webLocalOrigins(),
    css,
    injectTheme,
    onMessage,
    onReady,
    send,
  });

  useEffect(() => {
    targets.current = postTargets(bridge.origins);
  }, [bridge.origins]);

  useImperativeHandle(
    ref,
    () => ({
      post: bridge.post,
      reload: () => {
        const element = frame.current;
        if (element === null) return;
        bridge.reset();
        // Re-setting the source is the portable reload: touching
        // `contentWindow.location` throws on a cross-origin frame.
        const { src, srcdoc } = element;
        if (srcdoc) element.srcdoc = srcdoc;
        else element.src = src;
      },
    }),
    [bridge],
  );

  const { receive } = bridge;

  useEffect(() => {
    function handle(event: MessageEvent) {
      if (event.source !== frame.current?.contentWindow) return;
      receive(event.data, event.origin);
    }

    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [receive]);

  function handleLoad() {
    // Only reaches a same-origin `uri` frame — an `html` source already has
    // the shim in front of its own scripts, and the shim declines to
    // install itself twice.
    injectShim(frame.current, bridge.initialStylesheet, !zoomable);
    onLoad?.();
  }

  return (
    <View
      testID={testID}
      {...imageA11yProps({ label })}
      style={[styles.frame, style]}
    >
      <iframe
        ref={frame}
        title={label}
        {...("uri" in source
          ? { src: source.uri }
          : {
              srcDoc: htmlWithBridge(source.html, bridge.initialStylesheet, {
                lockZoom: !zoomable,
              }),
            })}
        onLoad={handleLoad}
        onError={() => {
          logger.failed(`WebView failed to load "${label}"`);
          onError?.("Unable to load");
        }}
        // `allow-scripts` because the bridge is JavaScript, and
        // `allow-same-origin` so a same-origin frame stays scriptable —
        // together they are only as permissive as a plain iframe already
        // is, and the origin check is what does the actual gatekeeping.
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        referrerPolicy="strict-origin-when-cross-origin"
        style={{
          border: "none",
          width: "100%",
          height: "100%",
          backgroundColor: theme.colors.background,
        }}
      />
    </View>
  );
});

export default WebView;

/**
 * What counts here as a document the app wrote.
 *
 * `srcdoc` would get an opaque origin on its own, but the frame carries
 * `allow-same-origin`, so it inherits this page's origin instead — and a
 * message from it arrives stamped with that. Both are listed because the
 * sandbox flags are the component's own choice and this should not quietly
 * break if they change.
 */
let localOrigins: readonly string[] | undefined;

function webLocalOrigins(): readonly string[] {
  if (localOrigins === undefined) {
    const own = typeof window === "undefined" ? null : window.location.origin;
    localOrigins =
      own === null || own === OPAQUE_ORIGIN
        ? [OPAQUE_ORIGIN]
        : [OPAQUE_ORIGIN, own];
  }
  return localOrigins;
}

/**
 * Puts the shim into a frame we are allowed to touch, and says nothing when
 * we are not.
 *
 * Reaching into `contentDocument` throws a `SecurityError` for a
 * cross-origin frame — which is the browser working correctly, not a fault
 * to report. The page is expected to carry `bridgeScript()` itself in that
 * case, so a log here would fire on every correctly-configured third-party
 * embed.
 */
function injectShim(
  frame: HTMLIFrameElement | null,
  css: string,
  lockZoom: boolean,
) {
  if (frame === null) return;

  try {
    const document = frame.contentDocument;
    if (!document) return;

    const script = document.createElement("script");
    script.textContent = `${lockZoom ? zoomLockScript() : ""}\n${bridgeScript(css)}`;
    (document.head || document.documentElement).appendChild(script);
  } catch {
    // Cross-origin. Expected — see above.
  }
}

const useStyles = createStyles(() => ({
  frame: {
    flex: 1,
    overflow: "hidden",
  },
}));
