import type { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Ellipse, Line, Path, Rect } from "react-native-svg";

import { GButton, GIcon, Label } from "./kit";
import { palette } from "./palette";

const looks: Record<string, { coat: string; hair: string; trim: string }> = {
  otaman: { coat: "#632a28", hair: "#29201c", trim: "#bf8861" },
  olha: { coat: "#482f49", hair: "#261e23", trim: "#b98e64" },
  sviatoslav: { coat: "#55595c", hair: "#292927", trim: "#a7a49a" },
  karmaliuk: { coat: "#2c3d34", hair: "#1c1b1a", trim: "#a98562" },
  merchant: { coat: "#675039", hair: "#3d2c21", trim: "#c79b61" },
  healer: { coat: "#3b5146", hair: "#36302b", trim: "#b6aa82" },
};

/** A small, shared storybook portrait rather than a new 3D render per popup. */
function SpeakerArt({ kind }: { kind?: string }) {
  const look = looks[kind ?? ""];
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
      {look ? (
        <>
          <Path
            d="M27 305 Q38 217 100 205 L129 191 171 191 203 205 Q268 217 278 305Z"
            fill={look.coat}
            stroke="#8b6d50"
            strokeWidth="2"
          />
          <Path
            d="M100 206 149 246 203 205M149 246v56"
            fill="none"
            stroke={look.trim}
            strokeWidth="4"
          />
          <Path
            d="m132 251 17 14 17-14m-34 17 17 14 17-14"
            fill="none"
            stroke={look.trim}
            strokeWidth="2"
            opacity={0.75}
          />
          <Path d="M116 166v41q35 30 69 0v-41" fill="#af7d62" />
          <Ellipse
            cx="151"
            cy="139"
            rx="53"
            ry="65"
            fill="#c99a77"
            stroke="#7d5947"
            strokeWidth="2"
          />
          <Path
            d="M99 127 Q99 72 148 70 Q203 68 204 127 L195 104 Q155 92 108 111Z"
            fill={look.hair}
          />
          {kind === "olha" || kind === "healer" ? (
            <Path
              d="M103 104Q83 143 95 212l22-5-3-72M195 104q24 42 7 108l-21-6 7-74"
              fill={look.hair}
            />
          ) : null}
          {kind === "otaman" || kind === "karmaliuk" || kind === "merchant" ? (
            <Path
              d="M95 94Q150 60 206 94l8 23H87Z"
              fill={look.hair}
              stroke={look.trim}
              strokeWidth="2"
            />
          ) : null}
          <Path
            d="M121 135q10-6 20 0m20 0q10-6 20 0"
            fill="none"
            stroke="#3c2b24"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <Circle cx="132" cy="138" r="2.5" fill="#201a18" />
          <Circle cx="170" cy="138" r="2.5" fill="#201a18" />
          <Path
            d="m151 140-5 18 8 3m-16 17q13 7 27-1"
            fill="none"
            stroke="#745041"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {kind === "otaman" || kind === "karmaliuk" || kind === "merchant" ? (
            <Path
              d="M128 170q11-8 23 1 13-9 25-1-12 17-25 8-14 8-23-8Z"
              fill={look.hair}
            />
          ) : null}
          {kind === "olha" ? (
            <Circle cx="193" cy="169" r="4" fill={look.trim} />
          ) : null}
        </>
      ) : (
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
      )}
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
          <SpeakerArt kind={kind} />
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
    bottom: 23,
    start: 16,
    end: 12,
    gap: 2,
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
