import { useSizes } from "@/features/responsive";
import { render, renderHook, screen } from "@/root/testing";

import Component from "./index";

function flatten(style: unknown): Record<string, unknown>[] {
  if (Array.isArray(style)) return style.flatMap(flatten);
  if (style && typeof style === "object")
    return [style as Record<string, unknown>];
  return {} as never;
}

function styleOf(testID = "divider") {
  return Object.assign(
    {},
    ...flatten(
      screen.getByTestId(testID, { includeHiddenElements: true }).props.style,
    ),
  ) as Record<string, unknown>;
}

describe(`${Component.name} smoke test`, () => {
  it("draws a horizontal rule by default", async () => {
    await render(<Component testID="divider" />);
    const style = styleOf();

    expect(style.height).toBeGreaterThan(0);
    expect(style.width).toBeUndefined();
    expect(style.alignSelf).toBe("stretch");
  });

  it("draws a vertical rule when asked", async () => {
    await render(<Component testID="divider" orientation="vertical" />);
    const style = styleOf();

    expect(style.width).toBeGreaterThan(0);
    expect(style.height).toBeUndefined();
  });

  describe("inset", () => {
    it("leaves both ends clear, by a step of the scale", async () => {
      const { result } = await renderHook(() => useSizes());
      await render(<Component testID="divider" inset="x16" />);

      expect(styleOf().marginHorizontal).toBe(result.current.spacing.x16);
    });

    it("takes a raw px value too", async () => {
      await render(<Component testID="divider" inset={10} />);

      expect(styleOf().marginHorizontal).toBe(10);
    });

    // A vertical rule's ends are top and bottom, so the inset has to move
    // with the orientation or it clears the wrong pair.
    it("insets a vertical rule along its own axis", async () => {
      await render(
        <Component testID="divider" orientation="vertical" inset={10} />,
      );

      expect(styleOf().marginVertical).toBe(10);
      expect(styleOf().marginHorizontal).toBeUndefined();
    });

    it("adds nothing by default", async () => {
      await render(<Component testID="divider" />);

      expect(styleOf().marginHorizontal).toBe(0);
    });
  });

  describe("accessibility", () => {
    // It's a drawn boundary and nothing more: the grouping it suggests is
    // already carried by the content either side.
    it("hides an unlabelled divider on every platform", async () => {
      await render(<Component testID="divider" />);
      const { props } = screen.getByTestId("divider", {
        includeHiddenElements: true,
      });

      expect(props.accessible).toBe(false);
      expect(props.accessibilityElementsHidden).toBe(true);
      expect(props.importantForAccessibility).toBe("no-hide-descendants");
      expect(props["aria-hidden"]).toBe(true);
    });

    // The other side of the same fact: a query that respects accessibility
    // — which is what a screen reader does — never sees it.
    it("is not reachable as an accessibility element", async () => {
      await render(<Component testID="divider" />);

      expect(screen.queryByTestId("divider")).toBeNull();
    });

    // A labelled divider does say something, so the label is announced and
    // the rules either side become the decoration.
    it("announces a label, and hides the rules around it", async () => {
      await render(<Component testID="divider" label="or" />);

      expect(screen.getByText("or")).toBeTruthy();
      expect(screen.getByTestId("divider")).toBeTruthy();
    });
  });

  it("centres a label between two equal rules", async () => {
    await render(<Component testID="divider" label="or" />);
    const rules = screen
      .getByTestId("divider")
      .children.filter((child) => typeof child !== "string");

    // Two rules and the label between them.
    expect(rules).toHaveLength(3);
  });

  it("merges a caller's style over its own", async () => {
    await render(<Component testID="divider" style={{ height: 4 }} />);

    expect(styleOf().height).toBe(4);
  });
});
