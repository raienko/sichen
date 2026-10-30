import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, G, Line, Path } from "react-native-svg";

import { content, getNode } from "../../data";
import { useT } from "../../i18n";
import * as actions from "../../state/actions";
import type { SaveData } from "../../state/save";
import { canAllocate, treePointsLeft } from "../../sim/hero";
import type { TreeNode } from "../../sim/types";
import { useModLines } from "../../ui/items";
import { GIcon, Label, RoundButton, Row } from "../../ui/kit";
import { palette } from "../../ui/palette";

import { Workspace } from "./workspace";

/**
 * The shared passive tree on a ritual stone floor, after the approved
 * composition. The graph is drawn from data/tree.ts: diamond notables and
 * class starts, round minor nodes, and allocated paths glowing in their
 * arm's colour. Pan and pinch (or the lower-left buttons) to zoom in before
 * picking a node; the picked node's details and the allocate button sit at
 * the bottom, within reach.
 */

const ATTR = {
  str: { color: "#d8553a", icon: "hand-fist" },
  dex: { color: "#5fbf5a", icon: "feather" },
  int: { color: "#4a8ae8", icon: "book" },
} as const;

function attrOf(id: string): keyof typeof ATTR | null {
  for (const a of ["str", "dex", "int"] as const)
    if (id.startsWith(a) || id.startsWith(`ring_${a}`)) return a;
  return null;
}

const colorOf = (id: string) => {
  const a = attrOf(id);
  return a ? ATTR[a].color : palette.gold;
};

/** The graph spans about ±7 units; this much fits the board's width. */
const SPAN = 15.5;
const ZOOM = { min: 0.8, max: 3, start: 1, step: 0.4 };

/** The stone floor: rings of slabs, carved marks and candles round the rim. */
function Floor({ size }: { size: number }) {
  const c = size / 2;
  const r = size * 0.48;
  const slabs = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    return `M${c + Math.cos(a) * r * 0.62} ${c + Math.sin(a) * r * 0.62} L${c + Math.cos(a) * r} ${c + Math.sin(a) * r}`;
  }).join(" ");
  // Four carved eight-point stars, a folk motif, at the quarters.
  const star = (x: number, y: number, s: number) =>
    Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      const b = a + Math.PI / 8;
      return `${i === 0 ? "M" : "L"}${x + Math.cos(a) * s} ${y + Math.sin(a) * s} L${x + Math.cos(b) * s * 0.45} ${y + Math.sin(b) * s * 0.45}`;
    }).join(" ") + " Z";
  const marks = [0, 1, 2, 3]
    .map((i) => {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      return star(
        c + Math.cos(a) * r * 0.8,
        c + Math.sin(a) * r * 0.8,
        r * 0.07,
      );
    })
    .join(" ");
  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      <Circle cx={c} cy={c} r={r} fill="#2f2a24" />
      <Circle cx={c} cy={c} r={r * 0.62} fill="#38322a" />
      <Circle
        cx={c}
        cy={c}
        r={r * 0.25}
        fill="none"
        stroke="#4a4136"
        strokeWidth={2}
      />
      <Path d={slabs} stroke="#1f1b17" strokeWidth={2} />
      <Path d={marks} fill="none" stroke="#4e4538" strokeWidth={1.5} />
      <Circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke="#4a4136"
        strokeWidth={3}
      />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <G key={i}>
            <Circle
              cx={c + Math.cos(a) * r * 1.02}
              cy={c + Math.sin(a) * r * 1.02}
              r={r * 0.05}
              fill="#f0a040"
              opacity={0.12}
            />
            <Circle
              cx={c + Math.cos(a) * r * 1.02}
              cy={c + Math.sin(a) * r * 1.02}
              r={r * 0.012}
              fill="#ffd27a"
            />
          </G>
        );
      })}
    </Svg>
  );
}

function NodeMark({
  node,
  at,
  on,
  open,
  focused,
  onPress,
  label,
}: {
  node: TreeNode;
  at: (v: number) => number;
  on: boolean;
  open: boolean;
  focused: boolean;
  onPress: () => void;
  label: string;
}) {
  const diamond = !!node.notable || !!node.start;
  const size =
    node.id === "hub" ? 36 : node.start ? 38 : node.notable ? 32 : 22;
  const color = colorOf(node.id);
  const a = attrOf(node.id);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      onPress={onPress}
      hitSlop={diamond ? 4 : 8}
      style={[
        styles.node,
        {
          left: at(node.x) - size / 2,
          top: at(node.y) - size / 2,
          width: size,
          height: size,
          borderRadius: diamond ? 5 : size / 2,
          transform: diamond ? [{ rotate: "45deg" }] : [],
          backgroundColor: on ? color : "#1c1814",
          borderColor: focused
            ? palette.white
            : open
              ? palette.amber
              : on
                ? color
                : "#5a5044",
          borderWidth: focused || open ? 2.5 : 1.5,
          opacity: on || open ? 1 : 0.75,
        },
        (on || focused) && {
          boxShadow: `0 0 10px 2px ${focused ? palette.amber : color}`,
        },
      ]}
    >
      {diamond ? (
        <View style={styles.unrotate}>
          <GIcon
            name={node.id === "hub" ? "sun" : a ? ATTR[a].icon : "star"}
            size={size * 0.38}
            color={on ? palette.night : palette.ivory}
          />
        </View>
      ) : (
        <View
          style={[
            styles.dot,
            { backgroundColor: on ? palette.night : "#6a5e50" },
          ]}
        />
      )}
    </Pressable>
  );
}

export function TreePanel({
  save,
  onClose,
}: {
  save: SaveData;
  onClose: () => void;
}) {
  const { t, tr } = useT();
  const lines = useModLines();
  const { hero } = save;
  const [area, setArea] = useState({ width: 0, height: 0 });
  const [focus, setFocus] = useState<string | null>(null);
  const allocated = new Set(hero.tree);
  const points = treePointsLeft(hero);
  const node = focus ? getNode(focus) : null;

  // The board is square, as wide as the smaller side of the area.
  const size = Math.min(area.width, area.height);
  const k = size / SPAN;
  const at = (v: number) => size / 2 + v * k;

  const scale = useSharedValue(ZOOM.start);
  const saved = useSharedValue(ZOOM.start);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const px = useSharedValue(0);
  const py = useSharedValue(0);
  const pan = Gesture.Pan()
    .minDistance(8)
    .onStart(() => {
      px.set(tx.get());
      py.set(ty.get());
    })
    .onUpdate((e) => {
      tx.set(px.get() + e.translationX);
      ty.set(py.get() + e.translationY);
    });
  const pinch = Gesture.Pinch()
    .onStart(() => {
      saved.set(scale.get());
    })
    .onUpdate((e) => {
      scale.set(Math.min(ZOOM.max, Math.max(ZOOM.min, saved.get() * e.scale)));
    });
  const board = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.get() },
      { translateY: ty.get() },
      { scale: scale.get() },
    ],
  }));
  const zoom = (by: number) => {
    scale.set(
      withTiming(Math.min(ZOOM.max, Math.max(ZOOM.min, scale.get() + by))),
    );
  };
  const recenter = () => {
    scale.set(withTiming(ZOOM.start));
    tx.set(withTiming(0));
    ty.set(withTiming(0));
  };

  const label = (n: TreeNode) =>
    n.notable ? tr(n.notable) : lines(n.mods).join(", ");

  return (
    <Workspace
      save={save}
      tab="tree"
      onClose={onClose}
      right={
        <View
          style={styles.points}
          accessible
          accessibilityLabel={t("tree.points", { points })}
        >
          <GIcon name="code-branch" size={14} color={palette.gold} />
          <Label value={String(points)} type="title3" color={palette.ivory} />
        </View>
      }
    >
      <View style={styles.area} onLayout={(e) => setArea(e.nativeEvent.layout)}>
        {size > 0 ? (
          <GestureDetector gesture={Gesture.Simultaneous(pan, pinch)}>
            <View style={styles.fill}>
              <Animated.View
                style={[
                  styles.board,
                  {
                    width: size,
                    height: size,
                    left: (area.width - size) / 2,
                    top: (area.height - size) / 2,
                  },
                  board,
                ]}
              >
                <Floor size={size} />
                <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
                  {content.tree.edges.map(([a, b]) => {
                    const na = getNode(a);
                    const nb = getNode(b);
                    const lit = allocated.has(a) && allocated.has(b);
                    const near = allocated.has(a) || allocated.has(b);
                    const color = colorOf(lit && attrOf(b) ? b : a);
                    const line = {
                      x1: at(na.x),
                      y1: at(na.y),
                      x2: at(nb.x),
                      y2: at(nb.y),
                    };
                    return (
                      <G key={`${a}-${b}`}>
                        {lit ? (
                          // A soft wide glow under the lit path.
                          <Line
                            {...line}
                            stroke={color}
                            strokeWidth={9}
                            opacity={0.25}
                            strokeLinecap="round"
                          />
                        ) : null}
                        <Line
                          {...line}
                          stroke={
                            lit ? color : near ? palette.bronze : "#4e4538"
                          }
                          strokeWidth={lit ? 3.5 : 2}
                          strokeLinecap="round"
                        />
                      </G>
                    );
                  })}
                </Svg>
                {content.tree.nodes.map((n) => (
                  <NodeMark
                    key={n.id}
                    node={n}
                    at={at}
                    on={allocated.has(n.id)}
                    open={canAllocate(hero, n.id)}
                    focused={focus === n.id}
                    onPress={() => setFocus(n.id)}
                    label={label(n)}
                  />
                ))}
              </Animated.View>
            </View>
          </GestureDetector>
        ) : null}
        {/* Zoom and recenter, lower left. */}
        <Row gap={10} style={styles.zoom}>
          <RoundButton
            accessibilityLabel={t("tree.recenter")}
            onPress={recenter}
          >
            <GIcon name="expand" size={16} color={palette.ivory} />
          </RoundButton>
          <RoundButton
            accessibilityLabel={t("tree.zoomOut")}
            onPress={() => zoom(-ZOOM.step)}
          >
            <GIcon name="minus" size={16} color={palette.ivory} />
          </RoundButton>
          <RoundButton
            accessibilityLabel={t("tree.zoomIn")}
            onPress={() => zoom(ZOOM.step)}
          >
            <GIcon name="plus" size={16} color={palette.ivory} />
          </RoundButton>
        </Row>
      </View>
      {node ? (
        <Row gap={12} style={styles.focus}>
          <View
            style={[
              styles.focusMark,
              { borderColor: colorOf(node.id) },
              (node.notable || node.start) && styles.diamond,
            ]}
          />
          <View style={styles.flex}>
            <Label
              value={node.notable ? tr(node.notable) : t("tree.minor")}
              type="headline"
              display
              color={palette.ivory}
            />
            <Label
              value={lines(node.mods).join(" · ")}
              type="footnote"
              color={palette.muted}
            />
          </View>
          <View>
            <RoundButton
              size={60}
              accessibilityLabel={t("tree.allocate")}
              selected={canAllocate(hero, node.id)}
              disabled={!canAllocate(hero, node.id)}
              onPress={() => actions.allocateNode(node.id)}
            >
              <GIcon name="plus" size={24} color={palette.amber} />
            </RoundButton>
            <View style={styles.badge}>
              <Label value={String(points)} type="caption1" />
            </View>
          </View>
        </Row>
      ) : null}
    </Workspace>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fill: { flex: 1 },
  area: { flex: 1, overflow: "hidden" },
  board: { position: "absolute" },
  node: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  unrotate: { transform: [{ rotate: "-45deg" }] },
  dot: { width: 6, height: 6, borderRadius: 3 },
  zoom: { position: "absolute", start: 0, bottom: 0 },
  points: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.bronze,
    backgroundColor: palette.glass,
  },
  focus: {
    alignItems: "center",
    padding: 10,
    borderRadius: 14,
    backgroundColor: palette.glass,
    borderWidth: 1,
    borderColor: palette.bronze,
  },
  focusMark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
  },
  diamond: { borderRadius: 4, transform: [{ rotate: "45deg" }] },
  badge: {
    position: "absolute",
    bottom: -4,
    end: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.night,
    borderWidth: 1,
    borderColor: palette.ivory,
  },
});
