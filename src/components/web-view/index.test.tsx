import { createRef } from "react";
import { Linking } from "react-native";

import { act, render } from "@/root/testing";

import { decodeMessage, encodeMessage } from "./bridge";
import { READY_MESSAGE, STYLE_MESSAGE } from "./injection";
import Component from "./index";
import type { WebViewHandle } from "./types";

const URI = "https://example.com/checkout";
const hidden = { includeHiddenElements: true } as const;

/**
 * Every script the app has injected. `injectJavaScript` is the app's only
 * way of talking into the page on native, so this is where a sent message
 * actually shows up — the mock in jest.setup.js records them.
 */
const injected = (
  jest.requireMock("react-native-webview") as {
    __injected: string[];
  }
).__injected;

beforeEach(() => {
  injected.length = 0;
});

type View = Awaited<ReturnType<typeof render>>;

/** The mocked native view, whose props are the app's half of the bridge. */
function web(view: View) {
  return view.getByTestId("native-web-view", hidden).props;
}

/**
 * Posts a message as if the page had — through the real `onMessage` shape,
 * so the origin check and the decoding are both exercised.
 */
async function pageSends(
  view: View,
  message: { type: string; payload?: unknown },
  url = URI,
) {
  await act(async () => {
    web(view).onMessage({
      nativeEvent: { data: encodeMessage(message), url },
    });
  });
}

/**
 * The message inside an injected `AppBridge.receive("…")` call — the app's
 * half of the wire, read back the way the page's shim would read it.
 */
function decodeInjected(script: string) {
  const literal = /receive\((".*?")\)/s.exec(script)?.[1];
  if (literal === undefined) return null;
  // Through the real reader, so this asserts the wire the page actually
  // sees rather than a second parser that could drift from it.
  return decodeMessage(JSON.parse(literal));
}

/** The page's shim announcing itself, which is what unlocks `post`. */
async function pageReady(view: View, url = URI) {
  await pageSends(view, { type: READY_MESSAGE }, url);
}

describe("WebView smoke test", () => {
  it("loads the source it was given", async () => {
    const view = await render(
      <Component testID="web" label="Checkout" source={{ uri: URI }} />,
    );

    expect(web(view).source).toEqual({ uri: URI });
  });

  // A web view is a rectangle of someone else's content with no name of its
  // own, and what is inside it isn't something the app can summarise.
  it("names the frame for a screen reader", async () => {
    const view = await render(
      <Component testID="web" label="Checkout" source={{ uri: URI }} />,
    );
    const { props } = view.getByTestId("web");

    expect(props.accessibilityLabel).toBe("Checkout");
    expect(props.accessibilityRole).toBe("image");
  });

  it("injects the shim before the page's own scripts run", async () => {
    const view = await render(
      <Component testID="web" label="Checkout" source={{ uri: URI }} />,
    );

    expect(web(view).injectedJavaScriptBeforeContentLoaded).toContain(
      "window.AppBridge",
    );
  });

  describe("receiving", () => {
    it("hands a decoded message to onMessage", async () => {
      const onMessage = jest.fn();
      const view = await render(
        <Component
          testID="web"
          label="Checkout"
          source={{ uri: URI }}
          onMessage={onMessage}
        />,
      );

      await pageSends(view, { type: "checkout.complete", payload: { id: 12 } });

      expect(onMessage).toHaveBeenCalledWith({
        type: "checkout.complete",
        payload: { id: 12 },
      });
    });

    /**
     * The shim travels with the view, so a page that redirects elsewhere
     * would otherwise be talking to `onMessage` from a site nobody named.
     */
    it("drops a message from an origin that wasn't allowed", async () => {
      const onMessage = jest.fn();
      const view = await render(
        <Component
          testID="web"
          label="Checkout"
          source={{ uri: URI }}
          onMessage={onMessage}
        />,
      );

      await pageSends(view, { type: "steal" }, "https://evil.com/page");

      expect(onMessage).not.toHaveBeenCalled();
    });

    it("takes an explicit list of origins over the source's own", async () => {
      const onMessage = jest.fn();
      const view = await render(
        <Component
          testID="web"
          label="Checkout"
          source={{ uri: URI }}
          allowedOrigins={["https://pay.example.com"]}
          onMessage={onMessage}
        />,
      );

      await pageSends(view, { type: "a" }, "https://pay.example.com/x");
      await pageSends(view, { type: "b" }, URI);

      expect(onMessage).toHaveBeenCalledTimes(1);
      expect(onMessage).toHaveBeenCalledWith({ type: "a" });
    });

    it("ignores traffic that isn't on our channel", async () => {
      const onMessage = jest.fn();
      const view = await render(
        <Component
          testID="web"
          label="Checkout"
          source={{ uri: URI }}
          onMessage={onMessage}
        />,
      );

      await act(async () => {
        web(view).onMessage({
          nativeEvent: { data: '{"type":"analytics"}', url: URI },
        });
      });

      expect(onMessage).not.toHaveBeenCalled();
    });

    it("does not report the ready handshake as a message", async () => {
      const onMessage = jest.fn();
      const onReady = jest.fn();
      const view = await render(
        <Component
          testID="web"
          label="Checkout"
          source={{ uri: URI }}
          onMessage={onMessage}
          onReady={onReady}
        />,
      );

      await pageReady(view);

      expect(onReady).toHaveBeenCalledTimes(1);
      expect(onMessage).not.toHaveBeenCalled();
    });
  });

  // The app wrote the document, so there is no third-party origin to name
  // — and neither platform gives one. Both report an opaque origin, which
  // is what `resolveOrigins` names for an `html` source.
  // A double tap blew the showcase page up past its frame on iOS.
  describe("zoom", () => {
    it("is off unless asked for", async () => {
      const view = await render(
        <Component label="Checkout" source={{ uri: URI }} />,
      );

      expect(web(view).setBuiltInZoomControls).toBe(false);
      expect(web(view).injectedJavaScriptBeforeContentLoaded).toContain(
        "user-scalable=no",
      );
    });

    it("is left to the page when zoomable", async () => {
      const view = await render(
        <Component label="Checkout" source={{ uri: URI }} zoomable />,
      );

      expect(web(view).setBuiltInZoomControls).toBe(true);
      expect(web(view).injectedJavaScriptBeforeContentLoaded).not.toContain(
        "user-scalable=no",
      );
    });
  });

  describe("an html source", () => {
    // Android can run injectedJavaScriptBeforeContentLoaded after the
    // document's inline scripts, so a page registering AppBridge.on() while
    // it parses would miss every message from the app. The shim goes into
    // the document itself, ahead of the page's own markup.
    it("carries the shim at the top of the document", async () => {
      const view = await render(
        <Component
          testID="web"
          label="Receipt"
          source={{ html: "<html><head></head><body><p>hi</p></body></html>" }}
        />,
      );

      const { html } = web(view).source as { html: string };
      expect(html.indexOf("window.AppBridge")).toBeGreaterThan(-1);
      expect(html.indexOf("window.AppBridge")).toBeLessThan(
        html.indexOf("<p>hi</p>"),
      );
    });

    it("is listened to even though it has no origin", async () => {
      const onMessage = jest.fn();
      const view = await render(
        <Component
          testID="web"
          label="Receipt"
          source={{ html: "<p>hi</p>" }}
          onMessage={onMessage}
        />,
      );

      await pageSends(view, { type: "height", payload: 200 }, "about:blank");

      expect(onMessage).toHaveBeenCalledWith({ type: "height", payload: 200 });
    });

    // Its opaque origin is not a blank cheque: follow a link out to a real
    // site and that site is a third party like any other.
    it("stops being listened to once it navigates to a real site", async () => {
      const onMessage = jest.fn();
      const view = await render(
        <Component
          testID="web"
          label="Receipt"
          source={{ html: "<p>hi</p>" }}
          onMessage={onMessage}
        />,
      );

      await pageSends(view, { type: "steal" }, "https://evil.com/page");

      expect(onMessage).not.toHaveBeenCalled();
    });
  });

  describe("navigating", () => {
    const navigate = (view: View, url: string, isTopFrame = true) =>
      web(view).onShouldStartLoadWithRequest({ url, isTopFrame });

    it("is locked down: no file access, no new windows", async () => {
      const view = await render(
        <Component label="Page" source={{ uri: URI }} />,
      );

      expect(web(view)).toMatchObject({
        allowFileAccess: false,
        allowFileAccessFromFileURLs: false,
        allowUniversalAccessFromFileURLs: false,
        setSupportMultipleWindows: false,
        javaScriptCanOpenWindowsAutomatically: false,
      });
    });

    it("follows links within the page's own origin", async () => {
      const view = await render(
        <Component label="Page" source={{ uri: URI }} />,
      );

      expect(navigate(view, "https://example.com/receipt")).toBe(true);
    });

    it("opens another site in the system browser instead", async () => {
      const openURL = jest
        .spyOn(Linking, "openURL")
        .mockResolvedValue(undefined);
      const view = await render(
        <Component label="Page" source={{ uri: URI }} />,
      );

      expect(navigate(view, "https://phish.example/login")).toBe(false);
      expect(openURL).toHaveBeenCalledWith("https://phish.example/login");
      openURL.mockRestore();
    });

    it("refuses other schemes without opening anything", async () => {
      const openURL = jest.spyOn(Linking, "openURL");
      const view = await render(
        <Component label="Page" source={{ uri: URI }} />,
      );

      expect(navigate(view, "otherapp://transfer?to=me")).toBe(false);
      expect(navigate(view, "javascript:alert(1)")).toBe(false);
      expect(openURL).not.toHaveBeenCalled();
      openURL.mockRestore();
    });

    it("leaves frames inside an allowed page alone", async () => {
      const view = await render(
        <Component label="Page" source={{ uri: URI }} />,
      );

      expect(navigate(view, "https://video.example/embed", false)).toBe(true);
    });
  });

  describe("sending", () => {
    it("injects a message into the page once it is ready", async () => {
      const ref = createRef<WebViewHandle>();
      const view = await render(
        <Component
          ref={ref}
          testID="web"
          label="Checkout"
          source={{ uri: URI }}
        />,
      );
      await pageReady(view);
      injected.length = 0;

      await act(async () => {
        ref.current?.post("cart.updated", { items: 2 });
      });

      expect(injected).toHaveLength(1);
      expect(injected[0]).toContain("AppBridge");
      expect(decodeInjected(injected[0])).toEqual({
        type: "cart.updated",
        payload: { items: 2 },
      });
    });

    // A caller with data already in hand shouldn't have to wait for
    // onReady; losing those posts is a bug that only shows on slow links.
    it("queues anything sent before the page is listening", async () => {
      const ref = createRef<WebViewHandle>();
      const view = await render(
        <Component
          ref={ref}
          testID="web"
          label="Checkout"
          source={{ uri: URI }}
        />,
      );

      await act(async () => {
        ref.current?.post("first");
        ref.current?.post("second");
      });

      expect(injected).toHaveLength(0);

      await pageReady(view);

      // In the order they were sent, and before the stylesheet that
      // follows the handshake.
      expect(injected.map(decodeInjected).map((m) => m?.type)).toEqual([
        "first",
        "second",
        STYLE_MESSAGE,
      ]);
    });
  });
});
