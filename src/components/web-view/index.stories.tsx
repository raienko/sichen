import { useRef, useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";

import Component from "./index";
import type { BridgeMessage, WebViewHandle } from "./types";

const meta = {
  title: "components/WebView",
  component: Component,
};

export default meta;

const PAGE = `<!doctype html>
<html>
  <body>
    <h1>Embedded page</h1>
    <p>Styled by the app, and talking to it.</p>
    <p><button id="send" type="button">Send an event</button></p>
    <p id="received"><small>Nothing received yet.</small></p>
    <script>
      document.getElementById("send").addEventListener("click", function () {
        AppBridge.post("page.pressed", { at: Date.now() });
      });
      AppBridge.on("app.greeting", function (payload) {
        document.getElementById("received").textContent = payload.text;
      });
    </script>
  </body>
</html>`;

export const Html = () => {
  const styles = useStyles();

  return (
    <View style={styles.stage}>
      <Component label="Embedded page" source={{ html: PAGE }} />
    </View>
  );
};

/** The bridge in both directions. */
export const Bridge = () => {
  const styles = useStyles();
  const web = useRef<WebViewHandle>(null);
  const [last, setLast] = useState<BridgeMessage | null>(null);

  return (
    <View style={styles.stack}>
      <View style={styles.stage}>
        <Component
          ref={web}
          label="Embedded page"
          source={{ html: PAGE }}
          onMessage={setLast}
        />
      </View>
      <Button
        value="Send a greeting into the page"
        onPress={() => web.current?.post("app.greeting", { text: "hello" })}
      />
      <Text
        value={
          last === null ? "Nothing received yet." : `Received: ${last.type}`
        }
        type="footnote"
      />
    </View>
  );
};

/** The app's typography off, so the page falls back to the browser's. */
export const WithoutTheme = () => {
  const styles = useStyles();

  return (
    <View style={styles.stage}>
      <Component
        label="Embedded page"
        source={{ html: PAGE }}
        injectTheme={false}
      />
    </View>
  );
};

/** Caller CSS on top of the theme's. */
export const CustomCss = () => {
  const styles = useStyles();

  return (
    <View style={styles.stage}>
      <Component
        label="Embedded page"
        source={{ html: PAGE }}
        css="h1 { text-transform: uppercase; letter-spacing: 2px }"
      />
    </View>
  );
};

/**
 * A real site. Native injects the bridge and the stylesheet; the browser
 * cannot script a cross-origin frame, so it gets neither unless the page
 * carries `bridgeScript()` itself.
 */
export const RemoteSite = () => {
  const styles = useStyles();

  return (
    <View style={styles.stage}>
      <Component label="Example" source={{ uri: "https://example.com" }} />
    </View>
  );
};

const useStyles = createStyles(({ units, spacing, radius }) => ({
  stack: {
    alignSelf: "stretch",
    gap: spacing.x12,
  },
  stage: {
    borderRadius: radius.surface,
    alignSelf: "stretch",
    height: units(280),
    overflow: "hidden",
  },
}));
