import { useRef, useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import Switch from "@/components/switch";
import Text from "@/components/text";
import WebView, {
  type BridgeMessage,
  type WebViewHandle,
} from "@/components/web-view";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

/**
 * A page that talks back. Written against `window.AppBridge`, which the
 * component injects — the same source works inside the native web view and
 * inside the browser's iframe, which is the whole point of the shim.
 */
const PAGE = `<!doctype html>
<html>
  <body>
    <h1>Embedded page</h1>
    <p>This document is styled by the app, and talks to it.</p>
    <p><button id="send" type="button">Send an event to the app</button></p>
    <p id="received"><small>Nothing received yet.</small></p>
    <script>
      var count = 0;
      document.getElementById("send").addEventListener("click", function () {
        count += 1;
        AppBridge.post("page.pressed", { count: count });
      });
      AppBridge.on("app.greeting", function (payload) {
        document.getElementById("received").textContent =
          "The app said: " + payload.text;
      });
    </script>
  </body>
</html>`;

/** The bridge in both directions, and the app's typography inside a page. */
export default function WebViewSection() {
  const theme = useTheme();
  const styles = useStyles();
  const web = useRef<WebViewHandle>(null);
  const [injectTheme, setInjectTheme] = useState(true);
  const [ready, setReady] = useState(false);
  const [last, setLast] = useState<BridgeMessage | null>(null);
  const [greetings, setGreetings] = useState(0);

  return (
    <View style={styles.container}>
      <Text
        value="Someone else's web page, embedded, with a two-way event bridge and the app's own typography pushed into it. react-native-webview on native, an iframe on the web, one set of props over both."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <Switch
        value={injectTheme}
        onChange={setInjectTheme}
        label="Inject the app's typography"
      />

      <View style={styles.stage}>
        <WebView
          ref={web}
          label="Embedded demo page"
          source={{ html: PAGE }}
          injectTheme={injectTheme}
          css="h1 { margin-top: 0 } button { font: inherit; padding: 8px 12px }"
          onReady={() => setReady(true)}
          onMessage={setLast}
        />
      </View>

      <Button
        value="Send a greeting into the page"
        onPress={() => {
          const next = greetings + 1;
          setGreetings(next);
          web.current?.post("app.greeting", { text: `hello #${next}` });
        }}
      />

      <Readout label="bridge" value={ready ? "ready" : "waiting"} />
      <Readout
        label="last message"
        value={
          last === null
            ? "none"
            : `${last.type} ${JSON.stringify(last.payload ?? null)}`
        }
      />

      <Text
        value="The page is written once against window.AppBridge. The shim picks ReactNativeWebView on native and window.parent in the browser, so the same document works in both."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
      <Text
        value="Only the origin you loaded is listened to. A page that redirects elsewhere is a third party, and its messages are dropped."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
    </View>
  );
}

const useStyles = createStyles(({ units, spacing, radius }) => ({
  container: {
    gap: spacing.x12,
  },
  stage: {
    borderRadius: radius.surface,
    height: units(280),
    alignSelf: "stretch",
    overflow: "hidden",
  },
}));
