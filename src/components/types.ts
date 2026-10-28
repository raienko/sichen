import type { StyleProp, ViewStyle } from "react-native";

/**
 * Shared implementation switch for components that offer both the app's
 * design-system UI and an @expo/ui-backed alternative.
 *
 * The public behavior stays the same for both implementations. Components
 * default to the custom implementation and opt into Expo UI with
 * `type="expo"`.
 */
export type ComponentType = "custom" | "expo";

export type ComponentTypeProps = {
  type?: ComponentType;
};

export const DEFAULT_COMPONENT_TYPE: ComponentType = "custom";

/**
 * The public contract shared by Checkbox, RadioButton and Switch. Their
 * semantics differ, but the controlled value, visible label, disabled state
 * and implementation switch do not. Keeping that shape here prevents one of
 * the three APIs gaining or losing a common prop independently.
 */
export type BinaryControlProps = ComponentTypeProps & {
  /** Controlled checked, selected, or enabled state. */
  value: boolean;
  /** Reports a user-requested state change. */
  onChange: (value: boolean) => void;
  /** Visible text and the control's accessible name. */
  label: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export type BinaryControlImplementationProps = Omit<BinaryControlProps, "type">;
