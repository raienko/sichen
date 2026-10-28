import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import Icon from "@/components/icon";
import { fireEvent, render, renderHook, screen } from "@/root/testing";

import Component, { NavigationTabBar, useTabBarSpace } from "./index";
import type { NavigationTabBarProps } from "./index";

const CHIN = { top: 47, bottom: 34, left: 0, right: 0 };

const ITEMS = [
  {
    key: "home",
    label: "Home",
    icon: <Icon name="home" />,
    testID: "tab-home",
  },
  { key: "search", label: "Search", testID: "tab-search" },
  { key: "profile", label: "Profile", testID: "tab-profile" },
];

function flatten(style: unknown): Record<string, unknown>[] {
  if (Array.isArray(style)) return style.flatMap(flatten);
  if (style && typeof style === "object")
    return [style as Record<string, unknown>];
  return [];
}

function barStyle() {
  return Object.assign(
    {},
    ...flatten(screen.getByTestId("bar").props.style),
  ) as Record<string, unknown>;
}

function withChin(ui: React.ReactElement) {
  return (
    <SafeAreaInsetsContext.Provider value={CHIN}>
      {ui}
    </SafeAreaInsetsContext.Provider>
  );
}

describe(`${Component.name} smoke test`, () => {
  it("renders one tab per item", async () => {
    await render(
      <Component
        testID="bar"
        items={ITEMS}
        value="home"
        onChange={jest.fn()}
      />,
    );

    expect(screen.getAllByRole("tab")).toHaveLength(ITEMS.length);
    expect(screen.getByText("Search")).toBeTruthy();
  });

  it("reports the pressed tab's key", async () => {
    const onChange = jest.fn();
    await render(
      <Component testID="bar" items={ITEMS} value="home" onChange={onChange} />,
    );

    await fireEvent.press(screen.getByTestId("tab-search"));

    expect(onChange).toHaveBeenCalledWith("search");
  });

  // Unlike SegmentedControl, re-pressing the current tab is meaningful —
  // "scroll to top" is written as a listener on exactly that press.
  it("reports the already-selected tab too", async () => {
    const onChange = jest.fn();
    await render(
      <Component testID="bar" items={ITEMS} value="home" onChange={onChange} />,
    );

    await fireEvent.press(screen.getByTestId("tab-home"));

    expect(onChange).toHaveBeenCalledWith("home");
  });

  describe("accessibility", () => {
    it("announces the set as a tab list", async () => {
      await render(
        <Component
          testID="bar"
          items={ITEMS}
          value="home"
          onChange={jest.fn()}
        />,
      );
      const { props } = screen.getByTestId("bar");

      expect(props.accessibilityRole).toBe("tablist");
      expect(props.role).toBe("tablist");
    });

    // A tab, not a button: picking it swaps the view rather than performing
    // an action, and it belongs to the set its parent declares.
    it("announces each tab with its name and selected state", async () => {
      await render(
        <Component
          testID="bar"
          items={ITEMS}
          value="search"
          onChange={jest.fn()}
        />,
      );

      expect(
        screen.getByRole("tab", { name: "Search", selected: true }),
      ).toBeTruthy();
      expect(
        screen.getByRole("tab", { name: "Home", selected: false }),
      ).toBeTruthy();
    });
  });

  describe("variants", () => {
    it("docks to the edge when sticky", async () => {
      await render(
        <Component
          testID="bar"
          items={ITEMS}
          value="home"
          onChange={jest.fn()}
        />,
      );
      const style = barStyle();

      expect(style.borderTopWidth).toBeGreaterThan(0);
      expect(style.borderRadius).toBeUndefined();
      expect(style.alignSelf).toBe("stretch");
    });

    it("lifts off the edge when floating", async () => {
      await render(
        <Component
          testID="bar"
          items={ITEMS}
          value="home"
          onChange={jest.fn()}
          variant="floating"
        />,
      );
      const style = barStyle();

      // Outlined on every side, with its corners taken from the shared
      // surface radius rather than a value of its own.
      expect(style.borderWidth).toBeGreaterThan(0);
      expect(style.borderRadius).toBeDefined();
      expect(style.marginHorizontal).toBeGreaterThan(0);
      expect(style.borderTopWidth).toBeUndefined();
    });
  });

  describe("avoidChin", () => {
    // Padded rather than made taller, so the row of tabs keeps its full
    // height and only the dead space below it grows.
    it("pads a sticky bar by the inset", async () => {
      await render(
        withChin(
          <Component
            testID="bar"
            items={ITEMS}
            value="home"
            onChange={jest.fn()}
          />,
        ),
      );

      expect(barStyle().paddingBottom).toBe(CHIN.bottom);
    });

    // A floating bar is already off the edge, so the inset moves it further
    // up rather than padding the inside of the bar.
    it("lifts a floating bar clear of the inset", async () => {
      await render(
        withChin(
          <Component
            testID="bar"
            items={ITEMS}
            value="home"
            onChange={jest.fn()}
            variant="floating"
          />,
        ),
      );

      expect(barStyle().marginBottom).toBeGreaterThan(CHIN.bottom);
      expect(barStyle().paddingBottom).toBeUndefined();
    });

    it("adds nothing when turned off", async () => {
      await render(
        withChin(
          <Component
            testID="bar"
            items={ITEMS}
            value="home"
            onChange={jest.fn()}
            avoidChin={false}
          />,
        ),
      );

      expect(barStyle().paddingBottom).toBe(0);
    });
  });
});

describe("useTabBarSpace", () => {
  // A tab bar is drawn over the screen, so nothing about the layout tells a
  // list that its last row is underneath one.
  it("reserves the bar's height plus the chin", async () => {
    const { result } = await renderHook(() => useTabBarSpace(), {
      wrapper: ({ children }) => withChin(<>{children}</>),
    });

    expect(result.current).toBeGreaterThan(CHIN.bottom);
  });

  it("reserves more for a floating bar, which also has a gap beneath it", async () => {
    const sticky = await renderHook(() => useTabBarSpace());
    const floating = await renderHook(() =>
      useTabBarSpace({ variant: "floating" }),
    );

    expect(floating.result.current).toBeGreaterThan(sticky.result.current);
  });

  it("drops the chin when the bar isn't avoiding it", async () => {
    const { result } = await renderHook(
      () => useTabBarSpace({ avoidChin: false }),
      { wrapper: ({ children }) => withChin(<>{children}</>) },
    );
    const withInset = await renderHook(() => useTabBarSpace(), {
      wrapper: ({ children }) => withChin(<>{children}</>),
    });

    expect(withInset.result.current - result.current).toBe(CHIN.bottom);
  });
});

describe("NavigationTabBar", () => {
  // Loosely typed on the way in and cast once on the way out: React
  // Navigation's real props carry a dozen methods this bar never touches,
  // and stubbing all of them would say nothing about the mapping under test.
  function navigatorProps(overrides: Record<string, unknown> = {}) {
    const routes = [
      { key: "home-1", name: "index", params: undefined },
      { key: "search-1", name: "search", params: undefined },
      { key: "hidden-1", name: "hidden", params: undefined },
    ];

    return {
      state: { index: 0, routes },
      descriptors: {
        "home-1": { options: { title: "Home" } },
        "search-1": { options: { title: "Search" } },
        // Expo Router's way of keeping a route out of the bar.
        "hidden-1": { options: { title: "Hidden", href: null } },
      },
      navigation: {
        emit: jest.fn(() => ({ defaultPrevented: false })),
        navigate: jest.fn(),
      },
      insets: { top: 0, bottom: 0, left: 0, right: 0 },
      ...overrides,
    } as unknown as NavigationTabBarProps;
  }

  it("takes each tab's label from the route's own options", async () => {
    await render(<NavigationTabBar {...navigatorProps()} />);

    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.getByText("Search")).toBeTruthy();
  });

  it("leaves out a route hidden with href: null", async () => {
    await render(<NavigationTabBar {...navigatorProps()} />);

    expect(screen.queryByText("Hidden")).toBeNull();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
  });

  it("marks the focused route selected", async () => {
    await render(<NavigationTabBar {...navigatorProps()} />);

    expect(
      screen.getByRole("tab", { name: "Home", selected: true }),
    ).toBeTruthy();
  });

  // The navigator's own path, not a shortcut to navigate(): a listener is
  // free to cancel the press.
  it("emits tabPress before navigating", async () => {
    const props = navigatorProps();
    await render(<NavigationTabBar {...props} />);

    await fireEvent.press(screen.getByText("Search"));

    expect(props.navigation.emit).toHaveBeenCalledWith({
      type: "tabPress",
      target: "search-1",
      canPreventDefault: true,
    });
    expect(props.navigation.navigate).toHaveBeenCalledWith("search", undefined);
  });

  it("does not navigate when a listener cancels the press", async () => {
    const props = navigatorProps({
      navigation: {
        emit: jest.fn(() => ({ defaultPrevented: true })),
        navigate: jest.fn(),
      },
    });
    await render(<NavigationTabBar {...props} />);

    await fireEvent.press(screen.getByText("Search"));

    expect(props.navigation.navigate).not.toHaveBeenCalled();
  });

  // Otherwise every press on the current tab pushes it again.
  it("does not re-navigate to the focused route", async () => {
    const props = navigatorProps();
    await render(<NavigationTabBar {...props} />);

    await fireEvent.press(screen.getByText("Home"));

    expect(props.navigation.emit).toHaveBeenCalled();
    expect(props.navigation.navigate).not.toHaveBeenCalled();
  });
});
