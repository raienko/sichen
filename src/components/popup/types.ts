import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

export type PopupType = "popup" | "alert" | "prompt";

type CallbackResult = void | Promise<void>;

type CommonPopupProps = {
  /** Identifies this instance for `Popup.show(id)` / `Popup.hide(id)`. */
  id: string;
  title?: string;
  message?: string;
  /** Additional content rendered between the message and the actions. */
  children?: ReactNode;
  confirmLabel?: string;
  style?: StyleProp<ViewStyle>;
  onShow?: () => void;
  onClose?: () => void;
};

export type ConfirmationPopupProps = CommonPopupProps & {
  type?: "popup";
  cancelLabel?: string;
  onConfirm?: () => CallbackResult;
  onCancel?: () => CallbackResult;
};

export type AlertPopupProps = CommonPopupProps & {
  type: "alert";
  onConfirm?: () => CallbackResult;
  cancelLabel?: never;
  onCancel?: never;
};

export type PromptPopupProps = CommonPopupProps & {
  type: "prompt";
  /** Visible and accessible name for the prompt's text field. */
  inputLabel: string;
  placeholder?: string;
  defaultValue?: string;
  cancelLabel?: string;
  onConfirm?: (value: string) => CallbackResult;
  onCancel?: () => CallbackResult;
};

export type PopupProps =
  ConfirmationPopupProps | AlertPopupProps | PromptPopupProps;
