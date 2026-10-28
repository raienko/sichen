import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Modal as RNModal } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Animated, {
  runOnJS,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import If from "@/components/if";
import { useAnimationDuration } from "@/features/accessibility";
import { createStyles } from "@/features/responsive";
import { wait, testId } from "@/utils";

import ModalBackdrop from "./backdrop";
import { MODAL_TYPE_CONFIG } from "./config";
import ModalContent from "./content";
import { ANIMATION_DURATION } from "./constants";
import { modalEventBus } from "./event-bus";
import ModalHandle from "./handle";
import { registerModalId, warnIfModalIdNotMounted } from "./registry";
import ModalScrollArea from "./scroll-area";
import type { ModalHandle as ModalHandleType, ModalProps } from "./types";

/**
 * Wraps RN's own Modal — already a native, full-window overlay, so no Root
 * wiring is needed for it to render above everything — and drives its
 * enter/exit visuals with Reanimated instead of Modal's built-in
 * `animationType`, so each `type` can define its own motion (see
 * ./config.ts). RN Modal unmounts its content the instant `visible` goes
 * false, which would cut an exit animation short — so `visible` only
 * follows a state flag that's flipped to false *after* the Reanimated exit
 * animation's completion callback fires, not immediately on hide().
 *
 * This file only owns state and lifecycle (show/hide/dismiss, the `id`
 * registry and event bus, the shared `progress`/`dragY` animated values) and
 * composes the actual UI from focused sub-components: ModalBackdrop, the
 * dimmed tap-to-dismiss layer; ModalContent, the animated positioned card;
 * ModalHandle, the bottom-sheet drag-to-dismiss grabber; ModalScrollArea,
 * the scrollable, spaced children wrapper. Each renders/behaves on its own —
 * this file just wires them to the same `progress`/`dragY` values and to
 * `dismiss`.
 *
 * Toggle it two ways, both converging on the same internal show/hide:
 * - locally, via a ref: `<Modal ref={ref} id="x">...</Modal>`, then
 *   `ref.current.show()` / `.hide()`
 * - globally, via `id`, from anywhere — no ref needed:
 *   `await Modal.show("x")` / `await Modal.hide("x")`, backed by
 *   ./event-bus.ts (built
 *   on the generic @/features/event-bus). ./registry.ts tracks which ids are
 *   currently mounted purely to log a dev warning on a typo'd/stale id
 *   or two instances accidentally sharing one id — both fail silently
 *   otherwise (a broadcast with no matching listener is a harmless no-op).
 *
 * A backdrop tap and the Android back button (RN Modal's onRequestClose)
 * both go through `onDismiss` — defaults to hiding the modal, but pass your
 * own to run different logic or to make the modal undismissable that way.
 * `onShow`/`onClose` are plain lifecycle callbacks — `onShow` is RN Modal's
 * own prop (fires once natively presented), `onClose` fires once *our* exit
 * animation finishes and the modal actually unmounts (not tied to
 * `onDismiss`, which only fires on a dismiss *request* and may not lead to
 * closing at all).
 *
 * @example
 * <Modal id="confirm-delete" type="popup"><Text value="Are you sure?" /></Modal>
 * // elsewhere, no ref needed:
 * Modal.show("confirm-delete");
 * @example
 * // undismissable by backdrop tap / back button — only Modal.hide(id) or a ref closes it
 * <Modal id="processing" type="popup" onDismiss={() => {}}>...</Modal>
 */
const ModalComponent = forwardRef<ModalHandleType, ModalProps>(function Modal(
  { id, type = "popup", children, style, onDismiss, onShow, onClose, testID },
  ref,
) {
  const config = MODAL_TYPE_CONFIG[type];
  const styles = useStyles();
  const owner = testID ?? testId("modal", id);
  const duration = useAnimationDuration();

  const [nativeVisible, setNativeVisible] = useState(false);
  const progress = useSharedValue(0);
  const dragY = useSharedValue(0);

  const show = useCallback(() => {
    setNativeVisible(true);
  }, []);

  const handleHidden = useCallback(() => {
    setNativeVisible(false);
    onClose?.();
  }, [onClose]);

  const hide = useCallback(() => {
    // Under "Reduce Motion" duration() is 0, so the exit lands immediately —
    // the completion callback still fires, so the delayed-unmount handshake
    // with RN Modal's `visible` prop works exactly the same either way.
    progress.value = withTiming(
      0,
      { duration: duration(ANIMATION_DURATION) },
      (finished) => {
        if (finished) runOnJS(handleHidden)();
      },
    );
  }, [progress, handleHidden, duration]);

  const dismiss = useCallback(() => {
    if (onDismiss) {
      onDismiss();
    } else {
      hide();
    }
  }, [onDismiss, hide]);

  useImperativeHandle(ref, () => ({ show, hide }), [show, hide]);

  useEffect(() => registerModalId(id), [id]);

  useEffect(() => {
    const unsubscribeShow = modalEventBus.on("show", (shownId) => {
      if (shownId === id) show();
    });
    const unsubscribeHide = modalEventBus.on("hide", (hiddenId) => {
      if (hiddenId === id) hide();
    });
    return () => {
      unsubscribeShow();
      unsubscribeHide();
    };
  }, [id, show, hide]);

  useEffect(() => {
    if (nativeVisible) {
      progress.value = withTiming(1, {
        duration: duration(ANIMATION_DURATION),
      });
    }
  }, [nativeVisible, progress, duration]);

  const containerStyle =
    config.position === "center"
      ? styles.containerCenter
      : config.position === "bottom"
        ? styles.containerBottom
        : styles.containerFullscreen;

  return (
    <RNModal
      statusBarTranslucent
      visible={nativeVisible}
      transparent
      animationType="none"
      onShow={onShow}
      onRequestClose={dismiss}
    >
      {/* A native Modal is its own full-screen window, so it measures its
          own safe area. Inherited insets describe wherever the app's root
          happens to sit — in Storybook that's below the status bar, so a
          full-screen modal would put its top bar under the notch. */}
      <SafeAreaProvider>
        {/* Gesture handler needs a root of its own inside the Modal's window
            too, for the same reason — the app's root view is in another
            window. react-native-gesture-handler requires it for gestures
            inside a native Modal on Android. */}
        <GestureHandlerRootView style={styles.gestureRoot}>
          <Animated.View
            testID={owner}
            style={containerStyle}
            accessibilityViewIsModal
          >
            <If condition={config.backdrop}>
              <ModalBackdrop
                testID={testId(owner, "backdrop")}
                progress={progress}
                maxOpacity={config.backdropOpacity}
                onDismiss={dismiss}
              />
            </If>
            <ModalContent
              config={config}
              progress={progress}
              dragY={dragY}
              style={style}
            >
              <If condition={config.position === "bottom"}>
                <ModalHandle
                  testID={testId(owner, "drag-handle")}
                  dragY={dragY}
                  onDismiss={dismiss}
                />
              </If>
              <If condition={config.scroll}>
                <ModalScrollArea position={config.position}>
                  {children}
                </ModalScrollArea>
              </If>
              <If condition={!config.scroll}>{children}</If>
            </ModalContent>
          </Animated.View>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </RNModal>
  );
});

type ModalStatic = {
  show: (id: string) => Promise<void>;
  hide: (id: string) => Promise<void>;
};

const Modal = ModalComponent as typeof ModalComponent & ModalStatic;

// forwardRef components have no .name (unlike a plain function component) —
// set explicitly so `describe(`${Component.displayName} smoke test`, ...)`
// still works the same way it does for every non-forwardRef component here.
Modal.displayName = "Modal";
Modal.show = async (id: string) => {
  warnIfModalIdNotMounted("show", id);
  modalEventBus.emit("show", id);
  await wait(ANIMATION_DURATION);
};
Modal.hide = async (id: string) => {
  warnIfModalIdNotMounted("hide", id);
  modalEventBus.emit("hide", id);
  await wait(ANIMATION_DURATION);
};

export default Modal;

// Re-exported so a consumer typing a ref (`useRef<ModalHandle>(null)`) or a
// wrapper's props can reach them through this folder's entry point, rather
// than importing from ./types directly.
export type { ModalHandle, ModalProps, ModalType } from "./types";

const useStyles = createStyles(({ spacing }) => ({
  containerCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.x24,
  },
  containerBottom: {
    flex: 1,
    justifyContent: "flex-end",
  },
  containerFullscreen: {
    flex: 1,
  },
  gestureRoot: {
    flex: 1,
  },
}));
