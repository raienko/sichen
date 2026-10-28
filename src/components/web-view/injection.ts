import { BRIDGE_CHANNEL, BRIDGE_GLOBAL } from "./bridge";

/** The message the shim applies as a stylesheet when it receives one. */
export const STYLE_MESSAGE = "app.style";
/** What the shim posts once it is listening, so the app can send safely. */
export const READY_MESSAGE = "app.ready";

/**
 * The `<style>` element the shim owns. Named so a second delivery replaces
 * the first rather than stacking sheets that override each other.
 */
const STYLE_ELEMENT_ID = "app-web-view-style";

/**
 * A JavaScript string literal for a value that came from a caller.
 *
 * `JSON.stringify` alone is not quite enough. It leaves `<` as itself, so a
 * stylesheet containing `</script>` closes the tag early if this script is
 * ever inlined into HTML — which is exactly what a page author does with
 * the exported `bridgeScript()`. It also leaves U+2028 and U+2029 raw, and
 * those are line terminators inside a JS string literal on older engines,
 * which ends the statement mid-value. Both are one substitution each and
 * neither changes what the string decodes to.
 */
function jsLiteral(value: string): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * The page-side half of the bridge, as source to run inside the page.
 *
 * **One API on both platforms.** A page written against this works
 * unchanged whether it is inside a native `WebView` or an `iframe`, because
 * the shim — not the page — is what knows which transport it has:
 * `window.ReactNativeWebView` when there is one, `window.parent` otherwise.
 * Without it, every page would need its own branch, which is exactly the
 * kind of thing that gets written once and then rots on the platform
 * nobody tests.
 *
 * ```js
 * AppBridge.on("cart.updated", (payload) => render(payload));
 * AppBridge.post("checkout.complete", { orderId: 12 });
 * ```
 *
 * Written as a string rather than a real module because it never runs in
 * this bundle — it is handed to `injectedJavaScriptBeforeContentLoaded` on
 * native and to a `<script>` on the web. It is deliberately small, ES5, and
 * dependency-free: it has to run before the page's own scripts, on whatever
 * engine the page gets loaded in.
 */
export function bridgeScript(initialCss?: string): string {
  // Everything interpolated goes through `jsLiteral` rather than being
  // pasted between quotes: this string becomes code, and a stylesheet is
  // caller data.
  return `(function () {
  if (window.${BRIDGE_GLOBAL}) return;

  var CHANNEL = ${jsLiteral(BRIDGE_CHANNEL)};
  var STYLE_ID = ${jsLiteral(STYLE_ELEMENT_ID)};
  var listeners = {};

  function send(type, payload) {
    var body = JSON.stringify({ channel: CHANNEL, type: type, payload: payload });
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(body);
    } else if (window.parent && window.parent !== window) {
      // "*" because a document rendered from srcdoc has an opaque origin
      // and cannot name its parent; the app checks the origin it receives.
      window.parent.postMessage(body, "*");
    }
  }

  function applyStyle(css) {
    var style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      style.setAttribute("type", "text/css");
      (document.head || document.documentElement).appendChild(style);
    }
    style.textContent = typeof css === "string" ? css : "";
  }

  function deliver(raw) {
    var envelope;
    try {
      envelope = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (error) {
      return;
    }
    if (!envelope || envelope.channel !== CHANNEL) return;

    if (envelope.type === ${jsLiteral(STYLE_MESSAGE)}) {
      applyStyle(envelope.payload);
      return;
    }

    var handlers = listeners[envelope.type] || [];
    for (var i = 0; i < handlers.length; i++) {
      try {
        handlers[i](envelope.payload);
      } catch (error) {
        // One bad listener must not stop the others.
      }
    }
  }

  window.${BRIDGE_GLOBAL} = {
    post: function (type, payload) {
      send(type, payload);
    },
    on: function (type, listener) {
      listeners[type] = (listeners[type] || []).concat(listener);
      return function () {
        listeners[type] = (listeners[type] || []).filter(function (entry) {
          return entry !== listener;
        });
      };
    },
    // Called by the app on native, where there is no message event to
    // listen for — injectJavaScript runs this directly.
    receive: deliver,
  };

  window.addEventListener("message", function (event) {
    deliver(event.data);
  });

  var initialCss = ${jsLiteral(initialCss ?? "")};
  if (initialCss) applyStyle(initialCss);

  function announce() {
    send(${jsLiteral(READY_MESSAGE)});
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", announce);
  } else {
    announce();
  }
})();`;
}

/** The `<style>` element that turns off touch zoom; see `zoomLockScript`. */
const ZOOM_STYLE_ELEMENT_ID = "app-web-view-zoom";

/**
 * Turns off pinch and double-tap zoom inside the page, for a view whose
 * `zoomable` is false.
 *
 * Neither platform has a switch for this that works on both: WKWebView has
 * no zoom prop at all and honours only the page's viewport, and Android's
 * `setBuiltInZoomControls` stops a pinch but not a double tap. So the page
 * is told, in the two ways browsers listen: a viewport that can't scale,
 * and `touch-action` that leaves only panning to the touch.
 *
 * The page's own viewport is kept apart from its scale limits, so a page
 * that lays itself out at some width still does. One with no viewport at
 * all is given `width=device-width`: a desktop-width layout that can't be
 * zoomed would be unreadable. It runs again once the page has parsed, which
 * is when a `<meta>` of its own can have arrived to overrule this one.
 */
export function zoomLockScript(): string {
  return `(function () {
  var STYLE_ID = ${jsLiteral(ZOOM_STYLE_ELEMENT_ID)};
  var LIMITS = /^\\s*(initial-scale|minimum-scale|maximum-scale|user-scalable)\\s*=/i;

  function locked(content) {
    var kept = [];
    var parts = (content || "width=device-width").split(",");
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i].replace(/^\\s+|\\s+$/g, "");
      if (part && !LIMITS.test(part)) kept.push(part);
    }
    return kept
      .concat("initial-scale=1", "maximum-scale=1", "user-scalable=no")
      .join(", ");
  }

  function lock() {
    var root = document.head || document.documentElement;
    if (!root) return;

    var metas = document.querySelectorAll('meta[name="viewport"]');
    if (metas.length === 0) {
      var meta = document.createElement("meta");
      meta.setAttribute("name", "viewport");
      root.appendChild(meta);
      metas = [meta];
    }
    for (var i = 0; i < metas.length; i++) {
      metas[i].setAttribute("content", locked(metas[i].getAttribute("content")));
    }

    if (!document.getElementById(STYLE_ID)) {
      var style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = "html { touch-action: pan-x pan-y; }";
      root.appendChild(style);
    }
  }

  lock();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", lock);
  }
})();`;
}

/**
 * The same script wrapped for `injectedJavaScript*`, which on iOS treats a
 * non-`true` completion value as a reason to warn — see the library's own
 * guide. The trailing `true;` is not decoration.
 */
export function nativeInjection(
  initialCss?: string,
  { lockZoom = false }: { lockZoom?: boolean } = {},
): string {
  return `${lockZoom ? `${zoomLockScript()}\n` : ""}${bridgeScript(initialCss)}\ntrue;`;
}

/**
 * A one-off delivery of a message into the page, for the native side, where
 * there is no `postMessage` from this end — `injectJavaScript` runs code
 * instead, so the code is a call into the shim we already put there.
 */
export function deliverInjection(encoded: string): string {
  return `window.${BRIDGE_GLOBAL} && window.${BRIDGE_GLOBAL}.receive(${jsLiteral(encoded)});\ntrue;`;
}

/**
 * A document with the shim in front of its own scripts.
 *
 * Injecting after `load` — the only moment a browser offers for a frame
 * whose content it did not write — is too late: a page that calls
 * `AppBridge.on(...)` at parse time throws a `ReferenceError` and never
 * registers its listener, so messages from the app go nowhere while
 * messages *to* it (registered later, in a click handler) keep working.
 * That asymmetry is exactly what the showcase showed the first time.
 *
 * For an `html` source there is a better moment, because the app owns the
 * document: put the shim at the top of it. That matches what native gets
 * from `injectedJavaScriptBeforeContentLoaded`, so both platforms give a
 * page the same guarantee — `AppBridge` exists before your first line runs.
 */
export function htmlWithBridge(
  html: string,
  initialCss?: string,
  { lockZoom = false }: { lockZoom?: boolean } = {},
): string {
  const zoom = lockZoom ? `<script>${zoomLockScript()}</script>` : "";
  const tag = `${zoom}<script>${bridgeScript(initialCss)}</script>`;
  const head = /<head[^>]*>/i.exec(html);
  if (head !== null) {
    const at = head.index + head[0].length;
    return html.slice(0, at) + tag + html.slice(at);
  }

  const body = /<body[^>]*>/i.exec(html);
  if (body !== null) {
    return html.slice(0, body.index) + tag + html.slice(body.index);
  }

  // A fragment rather than a document, which a browser wraps in html/body
  // for us. Anything before the first tag is still parsed and run in order.
  return tag + html;
}
