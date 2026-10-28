import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

import Icon from "@/components/icon";
import If from "@/components/if";
import Image from "@/components/image";
import MediaPlayer, { formatTime } from "@/components/media-player";
import Text from "@/components/text";
import {
  controlA11yProps,
  disabledA11yProps,
  imageA11yProps,
} from "@/features/accessibility";
import { formatNumber, useLocale } from "@/features/localization";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import { formatFileSize } from "./format";
import type { ChatAttachment, ChatAttachmentEvent } from "./types";

type ImageAttachment = Extract<ChatAttachment, { kind: "image" }>;
type VideoAttachment = Extract<ChatAttachment, { kind: "video" }>;
type FileAttachment = Extract<ChatAttachment, { kind: "file" }>;

type Props = {
  attachments: readonly ChatAttachment[];
  /** Opens the pictures full screen, at `index`. Without it they aren't pressable. */
  /**
   * A press on a picture (with all of them and its index), a video or a
   * file. Without it nothing is pressable. Voice messages play in place.
   */
  onOpen?: (event: ChatAttachmentEvent) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** The most picture tiles drawn; the last one counts the rest. */
const MAX_TILES = 4;

function isKind<K extends ChatAttachment["kind"]>(kind: K) {
  return (item: ChatAttachment): item is Extract<ChatAttachment, { kind: K }> =>
    item.kind === kind;
}

/**
 * What came with a message, by kind, in a fixed order: pictures as a grid,
 * then videos, voice messages and files.
 *
 * - **Pictures** — one fills the bubble at its own aspect ratio (4:3 until
 *   it's known); two sit side by side; three or more make a 2×2 grid whose
 *   last tile counts what didn't fit. A press opens them all, at that one,
 *   through `onOpen` — `Chat` wires it to a single `ImageViewer`.
 * - **Videos** — a still with a play mark and the duration; the player
 *   itself opens on press (`onOpen`), so a long thread isn't a column
 *   of mounted video players.
 * - **Voice messages** — an inline `MediaPlayer`: short, and the point of
 *   them is listening in place.
 * - **Files** — icon, name and size in one pressable row (`onOpen`).
 *
 * Each item is its own accessibility element with a name that says what
 * kind it is, since "IMG_2041.jpg" alone tells a listener very little.
 */
export default function Attachments({
  attachments,
  onOpen,
  style,
  testID,
}: Props) {
  const styles = useStyles();

  const images = attachments.filter(isKind("image"));
  const videos = attachments.filter(isKind("video"));
  const audios = attachments.filter(isKind("audio"));
  const files = attachments.filter(isKind("file"));

  return (
    <View testID={testID} style={[styles.stack, style]}>
      <If condition={images.length > 0}>
        <ImageGrid images={images} onOpen={onOpen} />
      </If>
      {videos.map((video) => (
        <VideoTile key={video.id} video={video} onOpen={onOpen} />
      ))}
      {audios.map((audio) => (
        <AudioRow key={audio.id} audio={audio} />
      ))}
      {files.map((file) => (
        <FileRow key={file.id} file={file} onOpen={onOpen} />
      ))}
    </View>
  );
}

function ImageGrid({
  images,
  onOpen,
}: {
  images: readonly ImageAttachment[];
  onOpen?: Props["onOpen"];
}) {
  const theme = useTheme();
  const styles = useStyles();
  const { t, locale } = useLocale();

  const tiles = images.slice(0, MAX_TILES);
  const hidden = images.length - tiles.length;
  const single = images.length === 1;

  return (
    <View style={styles.grid}>
      {tiles.map((image, index) => {
        const isLast = index === tiles.length - 1;
        const label = image.alt ?? image.name ?? t("chat.attachment.image");
        const aspectRatio =
          single && image.width && image.height
            ? image.width / image.height
            : single
              ? 4 / 3
              : 1;

        return (
          <Pressable
            key={image.id}
            disabled={onOpen === undefined}
            onPress={() => onOpen?.({ type: "image", images, index })}
            {...(onOpen === undefined
              ? imageA11yProps({ label })
              : controlA11yProps({ label }))}
            style={({ pressed }) => [
              single ? styles.tileSingle : styles.tile,
              images.length === 3 && index === 0 ? styles.tileWide : null,
              {
                aspectRatio:
                  images.length === 3 && index === 0 ? 2 : aspectRatio,
                backgroundColor: theme.colors.backgroundElement,
              },
              pressed ? styles.pressed : null,
            ]}
          >
            <Image
              source={image.uri}
              decorative
              contentFit="cover"
              style={styles.fill}
            />
            <If condition={isLast && hidden > 0}>
              <View {...disabledA11yProps()} style={[styles.fill, styles.more]}>
                <Scrim />
                <Text
                  value={t("chat.attachment.more", {
                    count: formatNumber(hidden, locale),
                  })}
                  type="title2"
                  style={{ color: theme.colors.onPrimary }}
                />
              </View>
            </If>
          </Pressable>
        );
      })}
    </View>
  );
}

function VideoTile({
  video,
  onOpen,
}: {
  video: VideoAttachment;
  onOpen?: Props["onOpen"];
}) {
  const theme = useTheme();
  const styles = useStyles();
  const { spacing } = useSizes();
  const { t } = useLocale();

  const label = [
    video.name ?? t("chat.attachment.video"),
    video.duration === undefined ? undefined : formatTime(video.duration),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Pressable
      disabled={onOpen === undefined}
      onPress={() => onOpen?.({ type: "video", attachment: video })}
      {...controlA11yProps({
        label,
        hint: t("chat.attachment.playVideo"),
        disabled: onOpen === undefined,
      })}
      style={({ pressed }) => [
        styles.tileSingle,
        styles.video,
        { backgroundColor: theme.colors.mediaSurface },
        pressed ? styles.pressed : null,
      ]}
    >
      <Image
        source={video.thumbnail}
        fallback={null}
        decorative
        contentFit="cover"
        style={styles.fill}
      />
      <View {...disabledA11yProps()} style={styles.play}>
        <Scrim />
        <Icon name="play" size={spacing.x24} color={theme.colors.onPrimary} />
      </View>
      <If condition={video.duration !== undefined}>
        <View {...disabledA11yProps()} style={styles.duration}>
          <Scrim />
          <Text
            value={formatTime(video.duration ?? 0)}
            type="caption2"
            style={{ color: theme.colors.onPrimary }}
          />
        </View>
      </If>
    </Pressable>
  );
}

/**
 * The darkening behind white text over a picture. A layer of its own rather
 * than an `opacity` on the container, which would fade the text with it.
 */
function Scrim() {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <View
      pointerEvents="none"
      style={[
        styles.fill,
        styles.scrim,
        { backgroundColor: theme.colors.overlay },
      ]}
    />
  );
}

function AudioRow({
  audio,
}: {
  audio: Extract<ChatAttachment, { kind: "audio" }>;
}) {
  const styles = useStyles();
  const { t } = useLocale();

  return (
    <MediaPlayer
      type="audio"
      source={audio.uri}
      label={audio.name ?? t("chat.attachment.audio")}
      style={styles.audio}
    />
  );
}

function FileRow({
  file,
  onOpen,
}: {
  file: FileAttachment;
  onOpen?: Props["onOpen"];
}) {
  const theme = useTheme();
  const styles = useStyles();
  const { spacing } = useSizes();
  const { t, locale } = useLocale();

  const name = file.name ?? t("chat.attachment.file");
  const size =
    file.size === undefined ? undefined : formatFileSize(file.size, locale, t);

  return (
    <Pressable
      disabled={onOpen === undefined}
      onPress={() => onOpen?.({ type: "file", attachment: file })}
      {...controlA11yProps({
        label: [t("chat.attachment.file"), name, size]
          .filter(Boolean)
          .join(", "),
        disabled: onOpen === undefined,
      })}
      style={({ pressed }) => [
        styles.file,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.divider,
        },
        pressed ? { backgroundColor: theme.colors.pressed } : null,
      ]}
    >
      <View
        {...disabledA11yProps()}
        style={[
          styles.fileIcon,
          { backgroundColor: theme.colors.backgroundElement },
        ]}
      >
        <Icon name="file-text" size={spacing.x20} color={theme.colors.accent} />
      </View>
      <View {...disabledA11yProps()} style={styles.fileText}>
        <Text value={name} type="subheadline" numberOfLines={1} />
        <If condition={size}>
          <Text
            value={size ?? ""}
            type="caption1"
            style={{ color: theme.colors.textSecondary }}
          />
        </If>
      </View>
    </Pressable>
  );
}

const useStyles = createStyles(({ units, spacing, radius, isRTL }) => ({
  stack: {
    gap: spacing.x4,
  },
  grid: {
    flexDirection: isRTL ? "row-reverse" : "row",
    flexWrap: "wrap",
    gap: units(2),
    overflow: "hidden",
    borderRadius: radius.surface,
  },
  tileSingle: {
    width: "100%",
    overflow: "hidden",
    borderRadius: radius.surface,
  },
  tile: {
    // Two to a row, less half the gap between them.
    width: "49.5%",
    flexGrow: 1,
    overflow: "hidden",
  },
  tileWide: {
    width: "100%",
  },
  fill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  more: {
    alignItems: "center",
    justifyContent: "center",
  },
  scrim: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.8,
  },
  video: {
    aspectRatio: 16 / 9,
    alignItems: "center",
    justifyContent: "center",
  },
  play: {
    width: units(48),
    height: units(48),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    overflow: "hidden",
  },
  duration: {
    position: "absolute",
    bottom: spacing.x8,
    ...(isRTL ? { left: spacing.x8 } : { right: spacing.x8 }),
    paddingHorizontal: spacing.x4,
    borderRadius: radius.indicator,
    overflow: "hidden",
  },
  audio: {
    minWidth: units(220),
  },
  file: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    gap: spacing.x12,
    padding: spacing.x8,
    borderWidth: units(1),
    borderRadius: radius.surface,
    minHeight: units(44),
  },
  fileIcon: {
    width: units(36),
    height: units(36),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.surface,
  },
  fileText: {
    flexShrink: 1,
  },
}));
