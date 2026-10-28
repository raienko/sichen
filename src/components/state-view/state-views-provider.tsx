import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import If from "@/components/if";
import Modal, { type ModalHandle } from "@/components/modal";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import StateView from "./state-view";
import stateViews, { useStateViewPresentation } from "./store";

/** The blocking overlay — one per app, so a fixed id. */
export const STATE_VIEW_OVERLAY_TEST_ID = "state-view-overlay";

type Props = {
  children: ReactNode;
};

const MODAL_ID = "state-view-overlay";
type ModalPhase = "hidden" | "visible" | "hiding";

/** Renders the store-backed StateView in a native, full-window modal. */
export default function StateViewsProvider({ children }: Props) {
  const presentation = useStateViewPresentation();
  const modalRef = useRef<ModalHandle>(null);
  const phaseRef = useRef<ModalPhase>("hidden");
  const reopenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useStyles();

  useEffect(() => {
    if (presentation.visible) {
      if (phaseRef.current === "hidden") {
        phaseRef.current = "visible";
        modalRef.current?.show();
      }
      return;
    }

    if (phaseRef.current === "visible") {
      phaseRef.current = "hiding";
      modalRef.current?.hide();
    }
  }, [presentation.visible]);

  useEffect(
    () => () => {
      if (reopenTimerRef.current !== null) {
        clearTimeout(reopenTimerRef.current);
      }
    },
    [],
  );

  const handleClose = useCallback(() => {
    phaseRef.current = "hidden";
    stateViews.completeHide();

    if (stateViews.get() === null) return;

    // A new state may replace one that was already fading out. RN Modal
    // needs one committed hidden frame before it can be presented again.
    reopenTimerRef.current = setTimeout(() => {
      reopenTimerRef.current = null;
      if (stateViews.get() === null) {
        stateViews.completeHide();
        return;
      }

      phaseRef.current = "visible";
      modalRef.current?.show();
    }, 0);
  }, []);

  return (
    <>
      {children}

      <Modal
        ref={modalRef}
        id={MODAL_ID}
        type="fullscreen"
        onDismiss={() => {}}
        onClose={handleClose}
        style={styles.modal}
      >
        <View
          testID={STATE_VIEW_OVERLAY_TEST_ID}
          accessibilityViewIsModal
          importantForAccessibility="yes"
          style={[
            styles.overlay,
            {
              backgroundColor: theme.colors.background,
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <If condition={presentation.entry}>
            <StateView {...presentation.entry!} />
          </If>
        </View>
      </Modal>
    </>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  modal: {
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
  },
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.x16,
  },
}));
