import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

export const STATE_VIEW_TYPES = [
  "loading",
  "empty",
  "error",
  "success",
  "offline",
] as const;

export type StateViewType = (typeof STATE_VIEW_TYPES)[number];

type ActionResult = void | Promise<void>;

type ActionProps =
  | {
      actionLabel: string;
      onAction: () => ActionResult;
    }
  | {
      actionLabel?: never;
      onAction?: never;
    };

export type StateViewProps = {
  /** Selects the default visual, colour, title, and announcement urgency. */
  type: StateViewType;
  /** Overrides the localized title supplied by `type`. */
  title?: string;
  message?: string;
  /** Domain-specific content rendered between the message and action. */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
} & ActionProps;

export type StateViewOverlayOptions = StateViewProps & {
  /** Replaces the current overlay with the same stable identity. Generated when omitted. */
  id?: string;
};

export type StateViewOverlayEntry = StateViewProps & {
  id: string;
};
