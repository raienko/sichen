import { ANY, testId, testIdPattern } from "./index";

describe("testId", () => {
  it("joins the owner and its parts with dots", () => {
    expect(testId("showcase", "carousel")).toBe("showcase.carousel");
    expect(testId("trip-photos", "slide", 42)).toBe("trip-photos.slide.42");
  });

  it("gives a part no id when its owner has none", () => {
    expect(testId(undefined, "close")).toBeUndefined();
  });

  it("keeps the owner as given and lower-cases each part", () => {
    expect(testId("showcase.carousel", "Next Slide")).toBe(
      "showcase.carousel.next-slide",
    );
    expect(testId("picker", "preset", "#E4002B")).toBe("picker.preset.e4002b");
    expect(testId("list", "a.b/c")).toBe("list.a-b-c");
  });

  it("skips empty parts, so an optional key can be passed as-is", () => {
    expect(testId("list", "item", undefined)).toBe("list.item");
    expect(testId("list", null, "item", 0)).toBe("list.item.0");
  });

  it("matches ids with a segment left open", () => {
    const close = testIdPattern("toasts", ANY, "close");
    expect(close.test("toasts.abc123.close")).toBe(true);
    expect(close.test("toasts.close")).toBe(false);
    expect(close.test("toasts.a.b.close")).toBe(false);
    expect(close.test("toastsxabcxclose")).toBe(false);
    expect(testIdPattern(ANY, "content").test("tab-home.content")).toBe(true);
    expect(testIdPattern("pages", 3).test("pages.3")).toBe(true);
  });
});
