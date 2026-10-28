import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

type CommonScreenProps = {
  /**
   * Pinned above the content — usually a `Header`. `Screen` clears the
   * notch above it, so don't also pass `avoidNotch` to the header.
   */
  header?: ReactNode;
  /**
   * Pinned below the content — the actions of a form, a checkout total.
   * `Screen` clears the home indicator below it.
   */
  footer?: ReactNode;
  children?: ReactNode;
  /** Applied to the content area, not the whole screen. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export type DefaultScreenProps = CommonScreenProps & {
  layout?: "default";
  /**
   * A full-height column at the start edge (the right in RTL) — section
   * navigation on a tablet or the web. Drawn whenever it's passed: a screen
   * that only wants it on wide windows decides that itself, e.g. with
   * `useBreakpoint()`.
   */
  aside?: ReactNode;
  /**
   * Puts the content in a ScrollView. Defaults to false: content that
   * scrolls itself — a `List` — must not end up inside a ScrollView, and a
   * screen that fits shouldn't rubber-band. Turn it on for content that can
   * outgrow the window.
   */
  scrollable?: boolean;
  /** Whether the content gets the standard page padding. Defaults to true. */
  padded?: boolean;
};

export type CenteredScreenProps = CommonScreenProps & {
  layout: "centered";
  aside?: never;
  scrollable?: never;
  padded?: never;
};

export type ScreenProps = DefaultScreenProps | CenteredScreenProps;

export type ScreenLayout = NonNullable<ScreenProps["layout"]>;
