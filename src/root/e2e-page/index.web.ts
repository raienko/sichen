/**
 * Makes `testID` the element's id on web too, so an end-to-end flow's
 * `id:` selector matches the same element on every platform.
 *
 * react-native-web renders a `testID` as `data-testid`, but Maestro's web
 * driver takes an element's id from its `id` attribute first, then its
 * `aria-label`, and reaches `data-testid` last — so anything with a label
 * (most of this app) is found by its label on web and by its testID on
 * iOS and Android. Copying `data-testid` into `id` puts it first.
 *
 */
function exposeTestIds(): () => void {
  const expose = (root: ParentNode) => {
    for (const element of root.querySelectorAll<HTMLElement>(
      "[data-testid]:not([id])",
    )) {
      element.id = element.dataset.testid ?? "";
    }
  };

  expose(document);
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const target = mutation.target;
      if (
        target instanceof HTMLElement &&
        target.dataset.testid &&
        !target.id
      ) {
        target.id = target.dataset.testid;
      }
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          if (node.dataset.testid && !node.id) node.id = node.dataset.testid;
          expose(node);
        }
      }
    }
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["data-testid"],
  });
  return () => observer.disconnect();
}

/**
 * Lets the page itself scroll. Maestro's web driver scrolls and swipes with
 * `window.scrollBy`, but the app scrolls inside its own ScrollView in a
 * window-sized root, so the window has nothing to scroll and anything below
 * the fold is out of reach. Freeing the root's height makes every Screen as
 * tall as its content, and the window scrolls instead.
 */
function letThePageScroll(): () => void {
  const style = document.createElement("style");
  style.id = "e2e-page-scroll";
  style.textContent = `
    html { height: auto !important; overflow: auto !important; }
    body { height: auto !important; overflow: visible !important; }
    #root { height: auto !important; min-height: 100vh; }
    [data-testid$=".scroll"] { overflow: visible !important; flex: none !important; }
  `;
  document.head.appendChild(style);
  return () => style.remove();
}

/**
 * Makes the web build drivable the same way as iOS and Android in an
 * end-to-end run: test ids as element ids, and a page that scrolls.
 * End-to-end builds only (Root calls it under `isE2E`): ordinary builds keep
 * the DOM and layout exactly as react-native-web renders them.
 */
export default function prepareE2EPage(): () => void {
  const stopExposing = exposeTestIds();
  const stopScrolling = letThePageScroll();
  return () => {
    stopExposing();
    stopScrolling();
  };
}
