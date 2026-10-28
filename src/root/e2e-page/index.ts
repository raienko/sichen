/**
 * iOS and Android need nothing: a `testID` is already the element's
 * identifier to end-to-end tools, and they scroll with real gestures. See
 * index.web.ts for what the web needs.
 */
export default function prepareE2EPage(): () => void {
  return () => {};
}
