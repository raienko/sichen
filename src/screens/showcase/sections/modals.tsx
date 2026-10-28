import { useRef, useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import Modal, { type ModalHandle } from "@/components/modal";
import Text from "@/components/text";
import { useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";

import Readout from "./readout";

/**
 * All four modal types, opened by `id` through the event bus — no refs
 * threaded through props. The last one is opened through a ref instead, to
 * show both halves of the API converging on the same internal show/hide,
 * and `onShow`/`onClose` drive the readout so the lifecycle callbacks are
 * visible rather than just documented.
 *
 * The modals themselves live outside the button row: they're always
 * mounted and render into a native overlay, so where they sit in the tree
 * doesn't affect where they appear.
 */
export default function ModalsSection() {
  const { t } = useLocale();
  const styles = useStyles();
  const refModal = useRef<ModalHandle>(null);
  const [lastEvent, setLastEvent] = useState("—");

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Button
          value={t("modal.popup.trigger")}
          onPress={() => Modal.show("showcase-popup")}
        />
        <Button
          value={t("modal.bottomSheet.trigger")}
          onPress={() => Modal.show("showcase-sheet")}
        />
        <Button
          value={t("modal.actions.trigger")}
          onPress={() => Modal.show("showcase-actions")}
        />
        <Button
          value={t("modal.fullscreen.trigger")}
          onPress={() => Modal.show("showcase-fullscreen")}
        />
        <Button value="via ref" onPress={() => refModal.current?.show()} />
      </View>

      <Readout label="last lifecycle event" value={lastEvent} />

      <Modal
        id="showcase-popup"
        type="popup"
        onShow={() => setLastEvent("popup onShow")}
        onClose={() => setLastEvent("popup onClose")}
      >
        <Text value={t("modal.popup.content")} type="title3" />
        <Text value="Tap the backdrop or Close to dismiss." type="footnote" />
        <Button
          value={t("common.close")}
          onPress={() => Modal.hide("showcase-popup")}
        />
      </Modal>

      <Modal id="showcase-sheet" type="bottomSheet">
        <Text value={t("modal.bottomSheet.content")} type="title3" />
        <Text value="Drag the grabber down to dismiss." type="footnote" />
        <Button
          value={t("common.close")}
          onPress={() => Modal.hide("showcase-sheet")}
        />
      </Modal>

      <Modal id="showcase-actions" type="actions">
        <Button
          value={t("modal.actions.optionA")}
          onPress={() => Modal.hide("showcase-actions")}
        />
        <Button
          value={t("modal.actions.optionB")}
          onPress={() => Modal.hide("showcase-actions")}
        />
        <Button
          type="secondary"
          value={t("common.close")}
          onPress={() => Modal.hide("showcase-actions")}
        />
      </Modal>

      <Modal id="showcase-fullscreen" type="fullscreen">
        <Text value={t("modal.fullscreen.content")} type="title3" />
        <Button
          value={t("common.close")}
          onPress={() => Modal.hide("showcase-fullscreen")}
        />
      </Modal>

      <Modal ref={refModal} id="showcase-ref" type="popup">
        <Text value="Opened through a ref" type="title3" />
        <Button
          value={t("common.close")}
          onPress={() => refModal.current?.hide()}
        />
      </Modal>
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x8,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.x8,
  },
}));
