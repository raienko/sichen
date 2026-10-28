import type { ImagePickerAsset } from "expo-image-picker";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { IconButton } from "@/components/button";
import FilePicker, { type FilePickerAsset } from "@/components/file-picker";
import Icon from "@/components/icon";
import If from "@/components/if";
import ImagePicker from "@/components/image-picker";
import Input from "@/components/input";
import Text from "@/components/text";
import { disabledA11yProps } from "@/features/accessibility";
import { useLocale } from "@/features/localization";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import AttachmentPreview from "./attachment-preview";
import type { ChatAttachment, ChatAttachmentKind } from "./types";

type Props = {
  /** Identifies this composer's pickers. Unique per mounted chat. */
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  /** Pending attachments, shown above the field. */
  attachments?: readonly ChatAttachment[];
  onAddAttachment?: (attachment: ChatAttachment) => void;
  onRemoveAttachment?: (attachment: ChatAttachment) => void;
  /** Upload progress per attachment id, 0–1. */
  attachmentProgress?: Readonly<Record<string, number>>;
  /** What may be attached. Defaults to none — no attach buttons. */
  attachmentKinds?: readonly ChatAttachmentKind[];
  /** A banner above the field: "Replying to Ada" with the quoted text. */
  replyTo?: { name: string; text: string };
  onCancelReply?: () => void;
  /** Edit mode: the banner says so, and sending updates instead of appending. */
  editing?: boolean;
  onCancelEdit?: () => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const MIME_BY_KIND: Record<Exclude<ChatAttachmentKind, "image">, string> = {
  video: "video/*",
  audio: "audio/*",
  file: "*/*",
};

let nextId = 0;
function attachmentId(): string {
  nextId += 1;
  return `pending-${Date.now()}-${nextId}`;
}

/** A picked file, sorted into the kind it will be drawn as. */
export function fromFile(file: FilePickerAsset): ChatAttachment {
  const base = {
    id: attachmentId(),
    uri: file.uri,
    name: file.name,
    size: file.size,
    mimeType: file.mimeType,
  };
  const type = file.mimeType ?? "";
  if (type.startsWith("image/")) return { ...base, kind: "image" };
  if (type.startsWith("video/")) return { ...base, kind: "video" };
  if (type.startsWith("audio/")) return { ...base, kind: "audio" };
  return { ...base, kind: "file" };
}

export function fromImage(image: ImagePickerAsset): ChatAttachment {
  return {
    id: attachmentId(),
    kind: "image",
    uri: image.uri,
    name: image.fileName ?? undefined,
    size: image.fileSize,
    mimeType: image.mimeType,
    width: image.width,
    height: image.height,
  };
}

/**
 * The composer at the foot of a chat: a field that grows to six lines,
 * attach buttons for the kinds allowed, and send.
 *
 * **The field is the kit's own `Input` textarea**, so it inherits focus
 * ring, colours, Dynamic Type and its accessibility for free. Return adds
 * a line, as it does there — send is the button.
 *
 * **Attaching reuses the pickers**: `ImagePicker` (camera or library)
 * behind the picture button when `image` is allowed, and a headless
 * `FilePicker` behind the paperclip for everything else, filtered to the
 * other kinds' MIME types. Whatever comes back is sorted into a
 * `ChatAttachment` by its type and handed to `onAddAttachment`.
 *
 * **Send is disabled until there is something to send** — text that isn't
 * only whitespace, or an attachment — so an accidental press never sends
 * an empty bubble.
 *
 * **Reply and edit show as a banner** above the field with a cancel
 * button, so the mode is visible and always one tap from undone.
 */
export default function ChatInput({
  id,
  value,
  onChange,
  onSend,
  attachments = [],
  onAddAttachment,
  onRemoveAttachment,
  attachmentProgress,
  attachmentKinds = [],
  replyTo,
  onCancelReply,
  editing = false,
  onCancelEdit,
  placeholder,
  maxLength,
  disabled = false,
  style,
  testID,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const { spacing } = useSizes();
  const { t } = useLocale();

  const canSend =
    !disabled && (value.trim().length > 0 || attachments.length > 0);
  const fileKinds = attachmentKinds.filter(
    (kind): kind is Exclude<ChatAttachmentKind, "image"> => kind !== "image",
  );
  const pickerId = `chat-composer:${id}`;
  const banner = editing
    ? {
        title: t("chat.editing"),
        text: undefined,
        cancel: onCancelEdit,
        cancelLabel: t("chat.cancelEdit"),
        icon: "edit-2" as const,
      }
    : replyTo
      ? {
          title: t("chat.replyingTo", { name: replyTo.name }),
          text: replyTo.text,
          cancel: onCancelReply,
          cancelLabel: t("chat.cancelReply"),
          icon: "corner-up-left" as const,
        }
      : undefined;

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.divider,
        },
        style,
      ]}
    >
      <If condition={banner}>
        <View style={[styles.banner, { borderColor: theme.colors.accent }]}>
          <View {...disabledA11yProps()}>
            <Icon
              name={banner?.icon ?? "edit-2"}
              size={spacing.x16}
              color={theme.colors.accent}
            />
          </View>
          <View style={styles.bannerText}>
            <Text
              value={banner?.title ?? ""}
              type="footnote"
              numberOfLines={1}
              style={{ color: theme.colors.accent }}
            />
            <If condition={banner?.text}>
              <Text
                value={banner?.text ?? ""}
                type="footnote"
                numberOfLines={1}
                style={{ color: theme.colors.textSecondary }}
              />
            </If>
          </View>
          <If condition={banner?.cancel}>
            <IconButton
              label={banner?.cancelLabel ?? ""}
              size="small"
              onPress={() => banner?.cancel?.()}
            >
              <Icon name="x" />
            </IconButton>
          </If>
        </View>
      </If>

      <AttachmentPreview
        attachments={attachments}
        progress={attachmentProgress}
        onRemove={(attachment) => onRemoveAttachment?.(attachment)}
      />

      <View style={styles.row}>
        <If condition={attachmentKinds.includes("image") && onAddAttachment}>
          <ImagePicker
            id={`${pickerId}:image`}
            accessibilityLabel={t("chat.attachPhoto")}
            disabled={disabled}
            onChange={(image) => onAddAttachment?.(fromImage(image))}
            style={styles.picker}
          >
            {/* A plain icon, not an IconButton — ImagePicker is the pressable,
                and nesting a second one swallows the press — so it takes the
                tertiary IconButton's accent by hand, to match the paperclip. */}
            <Icon name="image" size={spacing.x20} color={theme.colors.accent} />
          </ImagePicker>
        </If>

        <If condition={fileKinds.length > 0 && onAddAttachment}>
          <FilePicker
            id={`${pickerId}:file`}
            options={{
              type: fileKinds.includes("file")
                ? "*/*"
                : fileKinds.map((kind) => MIME_BY_KIND[kind]),
              copyToCacheDirectory: true,
            }}
            onChange={(file) => onAddAttachment?.(fromFile(file))}
          />
          <IconButton
            label={t("chat.attach")}
            disabled={disabled}
            onPress={() => FilePicker.open(`${pickerId}:file`)}
          >
            <Icon name="paperclip" />
          </IconButton>
        </If>

        <View style={styles.field}>
          <Input
            type="textarea"
            value={value}
            onChange={onChange}
            // No visible label: the placeholder names the field, which is
            // how Input derives an accessible name without one.
            placeholder={placeholder ?? t("chat.placeholder")}
            minLines={1}
            maxLines={6}
            maxLength={maxLength}
            disabled={disabled}
            style={styles.input}
          />
        </View>

        <IconButton
          label={t("chat.send")}
          type="primary"
          disabled={!canSend}
          onPress={onSend}
        >
          <Icon name="send" />
        </IconButton>
      </View>
    </View>
  );
}

const useStyles = createStyles(({ units, spacing, sizes, isRTL }) => ({
  container: {
    borderTopWidth: units(1),
    paddingBottom: spacing.x8,
  },
  banner: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    gap: spacing.x8,
    marginHorizontal: spacing.x16,
    marginTop: spacing.x8,
    paddingHorizontal: spacing.x8,
    [isRTL ? "borderRightWidth" : "borderLeftWidth"]: units(2),
  },
  bannerText: {
    flex: 1,
  },
  row: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "flex-end",
    gap: spacing.x4,
    paddingHorizontal: spacing.x8,
    paddingTop: spacing.x8,
  },
  picker: {
    width: sizes.elementHeightMd,
    height: sizes.elementHeightMd,
    alignItems: "center",
    justifyContent: "center",
  },
  field: {
    flex: 1,
  },
  input: {
    marginBottom: 0,
  },
}));
