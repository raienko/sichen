import { ScrollView, View, type StyleProp, type ViewStyle } from "react-native";

import { IconButton } from "@/components/button";
import Icon from "@/components/icon";
import If from "@/components/if";
import Image from "@/components/image";
import Match from "@/components/match";
import ProgressBar from "@/components/progress-bar";
import Text from "@/components/text";
import { disabledA11yProps } from "@/features/accessibility";
import { useLocale } from "@/features/localization";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import { formatFileSize } from "./format";
import type { ChatAttachment } from "./types";

type Props = {
  attachments: readonly ChatAttachment[];
  onRemove: (attachment: ChatAttachment) => void;
  /** Upload progress per attachment id, 0–1. Absent means not uploading. */
  progress?: Readonly<Record<string, number>>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const ICON_BY_KIND = {
  video: "film",
  audio: "mic",
  file: "file-text",
} as const;

/**
 * What's about to be sent, above the composer: a horizontal strip of
 * square tiles — the picture itself for images, an icon with the name for
 * everything else — each with a remove button and, while it uploads, a
 * progress bar along its foot.
 *
 * Renders nothing when there's nothing pending, so the composer can keep
 * it mounted. Each tile's remove button is named after the file ("Remove
 * IMG_2041.jpg"), so a screen reader can tell four of them apart.
 */
export default function AttachmentPreview({
  attachments,
  onRemove,
  progress,
  style,
  testID,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const { spacing } = useSizes();
  const { t, locale } = useLocale();

  return (
    <If condition={attachments.length > 0}>
      <ScrollView
        testID={testID}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
        style={style}
      >
        {attachments.map((attachment) => {
          const name =
            attachment.name ?? t(`chat.attachment.${attachment.kind}`);
          const value = progress?.[attachment.id];

          return (
            <View
              key={attachment.id}
              style={[
                styles.tile,
                {
                  backgroundColor: theme.colors.backgroundElement,
                  borderColor: theme.colors.divider,
                },
              ]}
            >
              <Match value={attachment.kind}>
                <Match.Case when="image">
                  <Image
                    source={attachment.uri}
                    alt={name}
                    contentFit="cover"
                    style={styles.fill}
                  />
                </Match.Case>
                <Match.Default>
                  <View style={styles.document}>
                    <Icon
                      name={
                        attachment.kind === "image"
                          ? "image"
                          : ICON_BY_KIND[attachment.kind]
                      }
                      size={spacing.x24}
                      color={theme.colors.accent}
                    />
                    <Text value={name} type="caption2" numberOfLines={2} />
                    <If condition={attachment.size !== undefined}>
                      <Text
                        {...disabledA11yProps()}
                        value={formatFileSize(attachment.size ?? 0, locale, t)}
                        type="caption2"
                        style={{ color: theme.colors.textSecondary }}
                      />
                    </If>
                  </View>
                </Match.Default>
              </Match>

              <If condition={value !== undefined}>
                <ProgressBar
                  value={value ?? 0}
                  label={name}
                  style={styles.progress}
                />
              </If>

              <IconButton
                label={t("chat.removeAttachment", { name })}
                size="small"
                type="secondary"
                onPress={() => onRemove(attachment)}
                style={styles.remove}
              >
                <Icon name="x" />
              </IconButton>
            </View>
          );
        })}
      </ScrollView>
    </If>
  );
}

const useStyles = createStyles(({ units, spacing, radius, isRTL }) => ({
  strip: {
    flexDirection: isRTL ? "row-reverse" : "row",
    gap: spacing.x8,
    paddingHorizontal: spacing.x16,
    paddingVertical: spacing.x8,
  },
  tile: {
    width: units(80),
    height: units(80),
    borderWidth: units(1),
    borderRadius: radius.surface,
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  document: {
    flex: 1,
    padding: spacing.x8,
    paddingTop: spacing.x12,
    gap: units(2),
  },
  progress: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  remove: {
    position: "absolute",
    top: 0,
    ...(isRTL ? { left: 0 } : { right: 0 }),
  },
}));
