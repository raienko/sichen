import { hasContent, toCopyText } from "./content";

describe("toCopyText", () => {
  /**
   * The clipboard is nearly always on its way into an address bar, a chat
   * box, or a QR generator, and "Check this out https://…" is wrong in all
   * three in a way the bare link never is.
   */
  it("prefers the URL over the message wrapped around it", () => {
    expect(
      toCopyText({ message: "Check this out", url: "https://example.com" }),
    ).toBe("https://example.com");
  });

  it("falls back to the message when there is no link", () => {
    expect(toCopyText({ message: "Check this out" })).toBe("Check this out");
  });

  // `title` names the sheet, not the thing being shared, and react-native
  // rejects content that is only a title — so it is not a payload here.
  it("does not fall back to the title, which is not a payload", () => {
    expect(toCopyText({ message: "", title: "Order #12" })).toBe("");
  });

  it("ignores a url that is only whitespace", () => {
    expect(toCopyText({ message: "hello", url: "   " })).toBe("hello");
  });

  it("has nothing to copy for empty content", () => {
    expect(toCopyText({ message: "" })).toBe("");
  });
});

describe("hasContent", () => {
  it.each([
    ["a url", { url: "https://example.com" }],
    ["a message", { message: "hello" }],
    ["a message beside a blank url", { message: "hello", url: "  " }],
  ])("is true for %s", (_name, content) => {
    expect(hasContent(content)).toBe(true);
  });

  // Reached by a URL that hasn't loaded yet more often than by a caller
  // getting it wrong, and an empty share sheet is worse than a disabled
  // button.
  it.each([
    ["nothing", { message: "" }],
    ["whitespace", { message: "   " }],
    ["an empty url", { url: "" }],
    ["a title and nothing else", { message: "", title: "Order" }],
  ])("is false for %s", (_name, content) => {
    expect(hasContent(content)).toBe(false);
  });
});
