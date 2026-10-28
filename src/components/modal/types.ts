import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

export type ModalType =
  | "popup"
  | "bottomSheet"
  | "actions"
  | "fullscreen"
  /** Edge-to-edge, unscrolled, for content that brings its own gestures — `ImageViewer`. */
  | "immersive";

export type ModalProps = {
  /** Identifies this modal instance for `Modal.show(id)`/`Modal.hide(id)`. */
  id: string;
  /** Default `modal.<id>`; its parts are `<testID>.backdrop` and `.drag-handle`. */
  testID?: string;
  /** Changes appearance and animation — see ./config.ts. Defaults to "popup". */
  type?: ModalType;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Called when the user *asks* to close the modal — a backdrop tap, or the
   * Android back button / RN Modal's onRequestClose. (Not RN Modal's own
   * `onDismiss`, which fires *after* an iOS-only dismissal animation
   * completes — this fires on the request, on every platform.) Defaults to
   * hiding the modal; pass your own to run different logic instead (a
   * confirmation prompt, ignoring the request entirely to make the modal
   * undismissable that way, ...). Doesn't affect `show`/`hide` via ref or
   * `Modal.show`/`Modal.hide` — those always still work.
   */
  onDismiss?: () => void;
  /** Fires once the modal has natively finished presenting (RN Modal's own `onShow`). */
  onShow?: () => void;
  /** Fires once the modal has fully closed — after the exit animation, when it actually unmounts. */
  onClose?: () => void;
};

export type ModalHandle = {
  show: () => void;
  hide: () => void;
};
