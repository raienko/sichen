import { useEffect, useState } from "react";
import { View } from "react-native";

import Icon from "@/components/icon";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Component from "./tab-bar";
import useTabBarSpace from "./space";
import type { TabBarItem, TabBarVariant } from "./types";

const meta = {
  title: "components/TabBar",
  component: Component,
};

export default meta;

const ITEMS: TabBarItem[] = [
  { key: "home", label: "Home", icon: <Icon name="home" /> },
  { key: "search", label: "Search", icon: <Icon name="search" /> },
  { key: "saved", label: "Saved", icon: <Icon name="bookmark" /> },
  { key: "profile", label: "Profile", icon: <Icon name="user" /> },
];

function Demo({
  variant,
  avoidChin,
}: {
  variant?: TabBarVariant;
  avoidChin?: boolean;
}) {
  const [value, setValue] = useState("home");

  return (
    <Component
      items={ITEMS}
      value={value}
      onChange={setValue}
      variant={variant}
      avoidChin={avoidChin}
    />
  );
}

export const Sticky = () => <Demo />;

export const Floating = () => <Demo variant="floating" />;

export const WithoutChinPadding = () => <Demo avoidChin={false} />;

/** Two tabs divide the row the same way four do. */
export const TwoTabs = () => {
  const [value, setValue] = useState("home");

  return (
    <Component items={ITEMS.slice(0, 2)} value={value} onChange={setValue} />
  );
};

/** Labels truncate rather than pushing their neighbours out of shape. */
export const LongLabels = () => {
  const [value, setValue] = useState("home");

  return (
    <Component
      items={ITEMS.map((item) => ({
        ...item,
        label: `${item.label} and then some`,
      }))}
      value={value}
      onChange={setValue}
    />
  );
};

/**
 * The selection change, on a loop: the indicator slides to the new tab
 * while the icons and labels crossfade. With Reduce Motion on the indicator
 * jumps instead and only the crossfade remains.
 */
export const ChangingTab = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setIndex((current) => (current + 1) % ITEMS.length),
      1200,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <Component
      items={ITEMS}
      value={ITEMS[index]?.key ?? ""}
      onChange={(key) => setIndex(ITEMS.findIndex((item) => item.key === key))}
    />
  );
};

/**
 * Icons given as a function of the tab's state, the way a navigator's
 * `tabBarIcon` arrives. The tab calls it once per colour, so these fade
 * with their labels exactly as plain `<Icon />`s do.
 */
export const IconRenderer = () => {
  const [value, setValue] = useState("home");
  const names = {
    home: "home",
    search: "search",
    saved: "bookmark",
    profile: "user",
  } as const;

  return (
    <Component
      items={ITEMS.map((item) => ({
        ...item,
        icon: ({ color, size }) => (
          <Icon
            name={names[item.key as keyof typeof names]}
            color={color}
            size={size}
          />
        ),
      }))}
      value={value}
      onChange={setValue}
    />
  );
};

/** What `useTabBarSpace()` is for: the last row clears the bar. */
export const ReservingSpace = () => {
  const theme = useTheme();
  const styles = useStyles();
  const space = useTabBarSpace();
  const [value, setValue] = useState("home");

  return (
    <View style={styles.screen}>
      <View style={[styles.content, { paddingBottom: space }]}>
        <Text value="Screen content" type="headline" />
        <Text
          value={`useTabBarSpace() reserves ${Math.round(space)}pt at the bottom.`}
          type="footnote"
          style={{ color: theme.colors.textSecondary }}
        />
      </View>
      <Component items={ITEMS} value={value} onChange={setValue} />
    </View>
  );
};

const useStyles = createStyles(({ spacing }) => ({
  screen: {
    alignSelf: "stretch",
  },
  content: {
    padding: spacing.x16,
    gap: spacing.x4,
  },
}));
