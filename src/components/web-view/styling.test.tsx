import { render } from "@/root/testing";

import { STYLE_MESSAGE } from "./injection";
import Component from "./index";

/**
 * Split from ./index.test.tsx for the reason `Badge`, `Tag`, `Avatar` and
 * `Stepper` split theirs: past a certain number of renders in one file this
 * harness stops resolving queries against freshly rendered trees, and Jest
 * isolates modules, so a second file starts clean.
 */
const URI = "https://example.com/checkout";
const hidden = { includeHiddenElements: true } as const;

type View = Awaited<ReturnType<typeof render>>;

function web(view: View) {
  return view.getByTestId("native-web-view", hidden).props;
}

describe("WebView styling", () => {
  describe("styling", () => {
    it("bakes the stylesheet into the shim, so it lands with the first paint", async () => {
      const view = await render(
        <Component
          testID="web"
          label="Checkout"
          source={{ uri: URI }}
          css=".total { font-weight: 600 }"
        />,
      );
      const injected = web(view).injectedJavaScriptBeforeContentLoaded;

      expect(injected).toContain("--app-color-text");
      expect(injected).toContain(".total { font-weight: 600 }");
    });

    it("leaves the app's own theme out when asked to", async () => {
      const view = await render(
        <Component
          testID="web"
          label="Checkout"
          source={{ uri: URI }}
          injectTheme={false}
          css=".total { font-weight: 600 }"
        />,
      );
      const injected = web(view).injectedJavaScriptBeforeContentLoaded;

      expect(injected).not.toContain("--app-color-text");
      expect(injected).toContain(".total { font-weight: 600 }");
    });

    it("has a style message to deliver changes with", async () => {
      const view = await render(
        <Component testID="web" label="Checkout" source={{ uri: URI }} />,
      );

      expect(web(view).injectedJavaScriptBeforeContentLoaded).toContain(
        STYLE_MESSAGE,
      );
    });
  });
});
