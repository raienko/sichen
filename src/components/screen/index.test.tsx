import { Text as RNText } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { LocalValue } from "@/features/storage";
import { render, screen, testId, within } from "@/root/testing";

import Component from "./index";

const NOTCH = { top: 47, bottom: 34, left: 0, right: 0 };

function flatten(style: unknown): Record<string, unknown>[] {
  if (Array.isArray(style)) return style.flatMap(flatten);
  if (style && typeof style === "object")
    return [style as Record<string, unknown>];
  return [];
}

function styleOf(testID: string, prop = "style") {
  return Object.assign(
    {},
    ...flatten(screen.getByTestId(testID).props[prop]),
  ) as Record<string, unknown>;
}

/** The real hook reads this context, so a notch is expressible in a test. */
function withNotch(ui: React.ReactElement) {
  return (
    <SafeAreaInsetsContext.Provider value={NOTCH}>
      {ui}
    </SafeAreaInsetsContext.Provider>
  );
}

const Text = ({ value }: { value: string }) => <RNText>{value}</RNText>;

describe(`${Component.name} default layout`, () => {
  it("leaves scrolling to the content by default", async () => {
    await render(
      <Component>
        <Text value="list" />
      </Component>,
    );

    expect(screen.queryByTestId(testId("screen", "scroll"))).toBeNull();
    expect(screen.getByText("list")).toBeTruthy();
  });

  it("scrolls its content when scrollable", async () => {
    await render(
      <Component scrollable>
        <Text value="hello" />
      </Component>,
    );

    expect(screen.getByTestId(testId("screen", "scroll"))).toBeTruthy();
    expect(screen.getByText("hello")).toBeTruthy();
  });

  it("pads the content unless told not to", async () => {
    await render(<Component />);
    expect(styleOf(testId("screen", "content")).padding).toBeGreaterThan(0);

    await render(<Component padded={false} />);
    expect(styleOf(testId("screen", "content")).padding).toBeUndefined();
  });

  it("pins the header and footer outside the scrolling content", async () => {
    await render(
      <Component
        scrollable
        header={<Text value="Header" />}
        footer={<Text value="Footer" />}
      >
        <Text value="Body" />
      </Component>,
    );

    const scroll = screen.getByTestId(testId("screen", "scroll"));
    expect(screen.getByTestId(testId("screen", "header"))).toBeTruthy();
    expect(screen.getByTestId(testId("screen", "footer"))).toBeTruthy();
    expect(within(scroll).queryByTestId(testId("screen", "header"))).toBeNull();
    expect(within(scroll).getByText("Body")).toBeTruthy();
  });

  it("draws an aside only when one is passed", async () => {
    await render(<Component />);
    expect(screen.queryByTestId(testId("screen", "aside"))).toBeNull();

    await render(<Component aside={<Text value="Sections" />} />);
    expect(screen.getByTestId(testId("screen", "aside"))).toBeTruthy();
    expect(screen.getByText("Sections")).toBeTruthy();
  });

  describe("safe areas", () => {
    it("clears the notch above the header and the chin below the footer", async () => {
      await render(
        withNotch(
          <Component
            scrollable
            header={<Text value="Header" />}
            footer={<Text value="Footer" />}
          />,
        ),
      );

      expect(styleOf(testId("screen", "header")).paddingTop).toBe(NOTCH.top);
      expect(styleOf(testId("screen", "footer")).paddingBottom).toBe(
        NOTCH.bottom,
      );
      // …so the content doesn't clear them a second time.
      const content = styleOf(
        testId("screen", "scroll"),
        "contentContainerStyle",
      );
      expect(content.paddingTop).toBe(0);
      expect(content.paddingBottom).toBe(0);
    });

    it("moves the insets onto the content when there are no bars", async () => {
      await render(withNotch(<Component scrollable />));

      const content = styleOf(
        testId("screen", "scroll"),
        "contentContainerStyle",
      );
      expect(content.paddingTop).toBe(NOTCH.top);
      expect(content.paddingBottom).toBe(NOTCH.bottom);
    });

    it("gives the aside both insets of its own", async () => {
      await render(
        withNotch(
          <Component
            header={<Text value="Header" />}
            aside={<Text value="Sections" />}
          />,
        ),
      );

      expect(styleOf(testId("screen", "aside")).paddingTop).toBe(NOTCH.top);
      expect(styleOf(testId("screen", "aside")).paddingBottom).toBe(
        NOTCH.bottom,
      );
    });
  });

  describe("direction", () => {
    const storedLocale = new LocalValue("locale-preference");
    afterEach(() => storedLocale.reset());

    it("puts the aside at the start edge", async () => {
      await render(<Component testID="screen" aside={<Text value="A" />} />);
      expect(styleOf("screen").flexDirection).toBe("row");
    });

    it("mirrors it in a right-to-left locale", async () => {
      storedLocale.setValue("ar");
      await render(<Component testID="screen" aside={<Text value="A" />} />);
      expect(styleOf("screen").flexDirection).toBe("row-reverse");
    });
  });
});

describe(`${Component.name} centered layout`, () => {
  it("centres its content", async () => {
    await render(
      <Component layout="centered">
        <Text value="Check your email" />
      </Component>,
    );

    expect(screen.getByText("Check your email")).toBeTruthy();
    expect(
      styleOf(testId("screen", "scroll"), "contentContainerStyle")
        .justifyContent,
    ).toBe("center");
  });

  it("takes an optional header and footer", async () => {
    await render(
      withNotch(
        <Component
          layout="centered"
          header={<Text value="Back" />}
          footer={<Text value="Resend link" />}
        >
          <Text value="Body" />
        </Component>,
      ),
    );

    expect(screen.getByText("Back")).toBeTruthy();
    expect(screen.getByText("Resend link")).toBeTruthy();
    expect(styleOf(testId("screen", "header")).paddingTop).toBe(NOTCH.top);
  });

  it("has no aside, scrollable or padded props", () => {
    // @ts-expect-error — a centered screen has no aside
    void (<Component layout="centered" aside={<Text value="x" />} />);
    // @ts-expect-error — nor a scrollable switch
    void (<Component layout="centered" scrollable={false} />);
  });
});
