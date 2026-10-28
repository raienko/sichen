import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import If from "@/components/if";
import Input from "@/components/input";
import Modal from "@/components/modal";
import Text from "@/components/text";
import logger from "@/features/logger";
import { useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import { popupEventBus } from "./event-bus";
import type { PopupProps, PopupType } from "./types";

const modalId = (id: string) => `popup:${id}`;

/**
 * A focused dialog built on the shared Modal primitive. Its `type` controls
 * the contract rather than only its appearance:
 *
 * - `popup`: title/message/custom content plus Confirm and Cancel
 * - `alert`: the same content with one OK action
 * - `prompt`: Confirm and Cancel around a managed text input
 *
 * Action callbacks run only after the Modal has finished hiding. This keeps
 * a callback free to present another native surface without it being closed
 * together with the outgoing modal.
 *
 * @example
 * <Popup id="delete" title="Delete item?" onConfirm={removeItem} />
 * await Popup.show("delete");
 * await Popup.hide("delete");
 */
function PopupComponent(props: PopupProps) {
  const { id, title, message, children, confirmLabel, style, onShow, onClose } =
    props;
  const type: PopupType = props.type ?? "popup";
  const { t } = useLocale();
  const theme = useTheme();
  const styles = useStyles();
  const defaultPromptValue =
    props.type === "prompt" ? (props.defaultValue ?? "") : "";
  const promptInput =
    props.type === "prompt"
      ? { label: props.inputLabel, placeholder: props.placeholder }
      : { label: "", placeholder: undefined };
  const cancelLabel =
    props.type === "alert"
      ? t("common.cancel")
      : (props.cancelLabel ?? t("common.cancel"));
  const [value, setValue] = useState(defaultPromptValue);
  const [busy, setBusy] = useState(false);

  const runAction = useCallback(
    async (callback?: () => void | Promise<void>) => {
      if (busy) return;
      setBusy(true);

      await Popup.hide(id);

      try {
        await callback?.();
      } catch (error) {
        logger.error(`Popup "${id}" action callback failed.`, error);
      } finally {
        setBusy(false);
      }
    },
    [busy, id],
  );

  const confirm = () => {
    if (props.type === "prompt") {
      return runAction(() => props.onConfirm?.(value));
    }
    return runAction(props.onConfirm);
  };

  const cancel = () =>
    runAction(props.type === "alert" ? undefined : props.onCancel);

  useEffect(
    () =>
      popupEventBus.on("willShow", (shownId) => {
        if (shownId !== id) return;
        if (props.type === "prompt") setValue(defaultPromptValue);
        setBusy(false);
      }),
    [id, props.type, defaultPromptValue],
  );

  return (
    <Modal
      id={modalId(id)}
      type="popup"
      style={style}
      onDismiss={() => void Popup.hide(id)}
      onShow={onShow}
      onClose={onClose}
    >
      <If condition={title}>
        <Text value={title ?? ""} type="title3" />
      </If>
      <If condition={message}>
        <Text
          value={message ?? ""}
          type="footnote"
          style={{ color: theme.colors.textSecondary }}
        />
      </If>

      {children}

      <If condition={props.type === "prompt"}>
        <Input
          value={value}
          onChange={setValue}
          label={promptInput.label}
          placeholder={promptInput.placeholder}
          disabled={busy}
        />
      </If>

      <View style={styles.actions}>
        <If condition={type !== "alert"}>
          <Button
            value={cancelLabel}
            disabled={busy}
            style={styles.action}
            onPress={() => void cancel()}
          />
        </If>
        <Button
          value={
            confirmLabel ??
            (type === "alert" ? t("common.ok") : t("common.confirm"))
          }
          type="primary"
          disabled={busy}
          style={styles.action}
          onPress={() => void confirm()}
        />
      </View>
    </Modal>
  );
}

type PopupStatic = {
  show: (id: string) => Promise<void>;
  hide: (id: string) => Promise<void>;
};

const Popup = PopupComponent as typeof PopupComponent & PopupStatic;

Popup.show = async (id) => {
  popupEventBus.emit("willShow", id);
  await Modal.show(modalId(id));
};
Popup.hide = (id) => Modal.hide(modalId(id));

export default Popup;
export type {
  AlertPopupProps,
  ConfirmationPopupProps,
  PopupProps,
  PopupType,
  PromptPopupProps,
} from "./types";

const useStyles = createStyles(({ isRTL, spacing }) => ({
  actions: {
    flexDirection: isRTL ? "row-reverse" : "row",
    gap: spacing.x8,
  },
  action: {
    flex: 1,
  },
}));
