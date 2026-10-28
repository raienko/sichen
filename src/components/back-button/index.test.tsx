import { router } from "expo-router";

import { LocalValue } from "@/features/storage";
import { fireEvent, render, screen, waitFor } from "@/root/testing";

import Component from "./index";

// Only `router` is replaced: `Providers` mounts `DeepLinks`, which reads
// `useNavigationContainerRef` from this same module, and a whole-module mock
// takes that away and fails every render before the button is reached.
jest.mock("expo-router", () => ({
  ...jest.requireActual("expo-router"),
  router: { back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn() },
}));

const mocked = router as jest.Mocked<typeof router>;

function button() {
  return screen.getByRole("button");
}

/**
 * The chevron, as react-native-vector-icons renders it: a `Text` whose only
 * child is the font's glyph for that name. Comparing the glyph is the one
 * way to tell `chevron-left` from `chevron-right` in a rendered tree, since
 * the icon name doesn't survive onto a host element.
 */
function chevronGlyph() {
  function find(node: unknown): string | undefined {
    if (node === null || typeof node !== "object") return undefined;
    const element = node as { type?: string; children?: unknown[] };
    if (element.type === "Text" && typeof element.children?.[0] === "string") {
      return element.children[0];
    }
    for (const child of element.children ?? []) {
      const glyph = find(child);
      if (glyph !== undefined) return glyph;
    }
    return undefined;
  }

  return find(screen.toJSON());
}

describe(`${Component.name} smoke test`, () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset rather than cleared: one test swaps in a throwing implementation.
    mocked.canGoBack.mockReset().mockReturnValue(true);
  });

  it("names itself in the current language", async () => {
    await render(<Component />);

    expect(button().props.accessibilityLabel).toBe("Back");
  });

  it("takes an explicit label over the translated one", async () => {
    await render(<Component label="Cancel" />);

    expect(button().props.accessibilityLabel).toBe("Cancel");
  });

  describe("without onPress", () => {
    it("pops the stack", async () => {
      await render(<Component />);

      await fireEvent.press(button());

      expect(mocked.back).toHaveBeenCalled();
      expect(mocked.replace).not.toHaveBeenCalled();
    });

    // A screen opened straight from a deep link has no history, so `back()`
    // is a no-op and the user is stranded on a dead button.
    // `_sitemap` rather than an invented route: `fallbackHref` is typed as
    // Expo Router's `Href`, so a path this app doesn't have is a `tsc`
    // error rather than a link that fails at runtime.
    it("replaces with the fallback when there is nothing to pop", async () => {
      mocked.canGoBack.mockReturnValue(false);
      await render(<Component fallbackHref="/_sitemap" />);

      await fireEvent.press(button());

      expect(mocked.back).not.toHaveBeenCalled();
      // `replace`, not `navigate` — pushing it would leave a history whose
      // own back button returns to the screen the user asked to leave.
      expect(mocked.replace).toHaveBeenCalledWith("/_sitemap");
    });

    // Outside an Expo Router root (Storybook, or before the root layout
    // mounts) `canGoBack` throws rather than answering. The button must
    // still render, and a press must not reach a router that isn't there.
    it("renders without a router, and does nothing when pressed", async () => {
      mocked.canGoBack.mockImplementation(() => {
        throw new TypeError(
          "Cannot read properties of undefined (reading 'isReady')",
        );
      });
      await render(<Component />);

      await fireEvent.press(button());

      expect(mocked.back).not.toHaveBeenCalled();
      expect(mocked.replace).not.toHaveBeenCalled();
    });

    it("falls back to the app root by default", async () => {
      mocked.canGoBack.mockReturnValue(false);
      await render(<Component />);

      await fireEvent.press(button());

      expect(mocked.replace).toHaveBeenCalledWith("/");
    });

    // A visible control that does nothing is worse than no control.
    it("renders nothing when stranded with the fallback opted out", async () => {
      mocked.canGoBack.mockReturnValue(false);
      await render(<Component fallbackHref={null} />);

      expect(screen.queryByRole("button")).toBeNull();
    });

    it("still renders with no fallback while there is history", async () => {
      await render(<Component fallbackHref={null} />);

      await fireEvent.press(button());

      expect(mocked.back).toHaveBeenCalled();
    });
  });

  describe("with onPress", () => {
    it("runs it instead of navigating", async () => {
      const onPress = jest.fn();
      await render(<Component onPress={onPress} />);

      await fireEvent.press(button());

      expect(onPress).toHaveBeenCalled();
      expect(mocked.back).not.toHaveBeenCalled();
      expect(mocked.replace).not.toHaveBeenCalled();
    });

    // The caller decides what pressing means; the button shouldn't vanish
    // underneath them because the stack happens to be empty.
    it("stays rendered even when there is nothing to go back to", async () => {
      mocked.canGoBack.mockReturnValue(false);
      const onPress = jest.fn();
      await render(<Component onPress={onPress} fallbackHref={null} />);

      await fireEvent.press(button());

      expect(onPress).toHaveBeenCalled();
    });
  });

  // Back is a direction, not a glyph: in a right-to-left locale the
  // previous screen is to the right, and a left-pointing chevron there
  // means forward.
  describe("in a right-to-left locale", () => {
    afterEach(() => {
      new LocalValue("locale-preference").reset();
    });

    it("mirrors the chevron and translates the label", async () => {
      await render(<Component />);
      const ltrGlyph = chevronGlyph();

      new LocalValue("locale-preference").setValue("ar");
      await render(<Component />);

      await waitFor(() => {
        expect(button().props.accessibilityLabel).toBe("رجوع");
      });
      expect(chevronGlyph()).not.toBe(ltrGlyph);
    });
  });

  it("ignores presses when disabled", async () => {
    await render(<Component disabled />);

    await fireEvent.press(button());

    expect(mocked.back).not.toHaveBeenCalled();
    expect(button().props.accessibilityState.disabled).toBe(true);
  });
});
