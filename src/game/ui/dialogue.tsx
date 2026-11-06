import type { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";

import { isPersonNpc } from "../render/art-kit";
import NpcPortrait from "../render/npc-portrait";

import { GButton, GIcon, Label } from "./kit";
import { palette } from "./palette";

/**
 * The painted stage behind a speaker: a person from the world stands on it
 * as their own 3D figure (see NpcPortrait); a quest object gets an emblem.
 */
function SpeakerArt({ emblem }: { emblem: boolean }) {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 300 300"
      preserveAspectRatio="xMidYMid slice"
    >
      <Rect width="300" height="300" fill="#151d1e" />
      <Path
        d="M0 232 23 132 42 210 61 114 88 232M205 230l22-108 23 94 25-97 25 113"
        fill="#111819"
        opacity={0.85}
      />
      <Circle cx="153" cy="129" r="91" fill="#503425" opacity={0.27} />
      <Circle cx="153" cy="129" r="61" fill="#8f5536" opacity={0.12} />
      {emblem ? (
        <>
          <Path
            d="M147 65 205 120 178 218H118L91 120Z"
            fill="#2e2821"
            stroke="#9d7953"
            strokeWidth="4"
          />
          <Path
            d="m148 100 27 34-27 35-27-35Z"
            fill="none"
            stroke="#c19b6c"
            strokeWidth="3"
          />
          <Path d="M148 111v47m-19-24h38" stroke="#c19b6c" strokeWidth="2" />
        </>
      ) : null}
      <Rect x="0" y="281" width="300" height="19" fill="#171a18" />
      <Line
        x1="0"
        y1="282"
        x2="300"
        y2="282"
        stroke="#8d704d"
        strokeWidth="2"
      />
    </Svg>
  );
}

/** Fixed geometry keeps every speaker, line and set of choices in one place. */
export function DialogueFrame({
  name,
  title,
  kind,
  line,
  onClose,
  children,
}: {
  name: string;
  title?: string;
  kind?: string;
  line?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const portrait = height > width;
  const frameHeight = Math.min(
    height - insets.top - insets.bottom - 24,
    portrait ? 570 : 390,
  );
  return (
    <View style={styles.backdrop}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityLabel="Close"
      />
      <View
        style={[
          styles.frame,
          portrait ? styles.framePortrait : styles.frameLandscape,
          { height: frameHeight },
        ]}
      >
        <View
          style={[
            styles.stage,
            portrait ? styles.stagePortrait : styles.stageLandscape,
          ]}
        >
          <SpeakerArt emblem={!isPersonNpc(kind)} />
          {isPersonNpc(kind) ? (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <NpcPortrait kind={kind!} />
            </View>
          ) : null}
          <View style={styles.stageShade} />
          <View style={styles.stageCaption}>
            <Label value={name} type="title2" color={palette.ivory} />
            {title ? (
              <Label value={title} type="caption1" color={palette.muted} />
            ) : null}
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.topRule} />
          <GButton
            icon="xmark"
            tone="ghost"
            compact
            onPress={onClose}
            accessibilityLabel="Close"
            style={styles.close}
          />
          <View style={styles.speech}>
            {line ? (
              <Label value={line} type="callout" color={palette.ivory} />
            ) : (
              <GIcon name="ellipsis" size={22} color={palette.muted} />
            )}
          </View>
          <View style={styles.divider} />
          <ScrollView
            style={styles.actions}
            contentContainerStyle={styles.actionsBody}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(3, 6, 7, 0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  frame: {
    width: "100%",
    maxWidth: 900,
    overflow: "hidden",
    backgroundColor: "#191b1a",
    borderWidth: 1,
    borderColor: "#6f5940",
  },
  framePortrait: { flexDirection: "column" },
  frameLandscape: { flexDirection: "row" },
  stage: { overflow: "hidden", backgroundColor: "#151d1e" },
  stagePortrait: { height: "39%" },
  stageLandscape: { width: "37%" },
  stageShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(9, 11, 10, 0.14)",
  },
  stageCaption: {
    position: "absolute",
    bottom: 0,
    start: 0,
    end: 0,
    gap: 2,
    paddingTop: 10,
    paddingBottom: 14,
    paddingStart: 16,
    paddingEnd: 12,
    backgroundColor: "rgba(8, 9, 8, 0.85)",
    borderTopWidth: 1,
    borderTopColor: "rgba(141, 112, 77, 0.45)",
  },
  content: { flex: 1, backgroundColor: "#201c19" },
  topRule: { height: 3, backgroundColor: "#8d704d" },
  close: { position: "absolute", end: 6, top: 7, zIndex: 1 },
  speech: {
    minHeight: 94,
    paddingTop: 42,
    paddingBottom: 13,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  divider: { height: 1, backgroundColor: "#6d5943", marginHorizontal: 18 },
  actions: { flex: 1 },
  actionsBody: { padding: 18, gap: 12, flexGrow: 1 },
});
