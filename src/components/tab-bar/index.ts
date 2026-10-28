/**
 * A barrel, for the reason `button` and `icon` have one: `navigation.tsx`
 * imports the bar it wraps, so defining the component here would have the
 * two importing each other — a require cycle Metro allows but warns can
 * leave a value uninitialised.
 */
export { default } from "./tab-bar";
export { default as NavigationTabBar } from "./navigation";
export { default as useTabBarSpace } from "./space";
export type { NavigationTabBarProps } from "./navigation";
export type {
  TabBarIconState,
  TabBarItem,
  TabBarLayoutProps,
  TabBarProps,
  TabBarVariant,
} from "./types";
