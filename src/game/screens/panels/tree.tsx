import { useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { G, Line } from "react-native-svg";

import { content, getNode } from "../../data";
import { useT } from "../../i18n";
import * as actions from "../../state/actions";
import type { SaveData } from "../../state/save";
import { canAllocate } from "../../sim/hero";
import type { TreeNode } from "../../sim/types";
import { useModLines } from "../../ui/items";
import { GIcon, Label, RoundButton, Row } from "../../ui/kit";
import { palette } from "../../ui/palette";

import { Workspace } from "./workspace";

/** The passive graph follows the coordinates in data/tree.ts without a backdrop. */

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

const ZOOM = { min: 0.8, max: 3, start: 1, step: 0.4 };
const TREE_BOUNDS = (() => {
  const xs = content.tree.nodes.map((node) => node.x);
  const ys = content.tree.nodes.map((node) => node.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    span: Math.max(maxX - minX, maxY - minY, 1) + 2.5,
  };
})();

function NodeMark({
  node,
  atX,
  atY,
  on,
  open,
  focused,
  onPress,
  label,
}: {
  node: TreeNode;
  atX: (v: number) => number;
  atY: (v: number) => number;
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
          left: atX(node.x) - size / 2,
          top: atY(node.y) - size / 2,
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
  const { width, height } = useWindowDimensions();
  const shortLandscape = width > height && height < 500;
  const lines = useModLines();
  const { hero } = save;
  const [area, setArea] = useState({ width: 0, height: 0 });
  const [focus, setFocus] = useState<string | null>(null);
  const allocated = new Set(hero.tree);
  const node = focus ? getNode(focus) : null;

  // The board is square, as wide as the smaller side of the area.
  const size = Math.min(area.width, area.height);
  const k = size / TREE_BOUNDS.span;
  const atX = (v: number) => size / 2 + (v - TREE_BOUNDS.centerX) * k;
  const atY = (v: number) => size / 2 + (v - TREE_BOUNDS.centerY) * k;

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
    <Workspace save={save} tab="tree" onClose={onClose} hideHeader>
      <View
        style={[styles.treeLayout, shortLandscape && styles.treeLayoutShort]}
      >
        <View
          style={[styles.detailSlot, shortLandscape && styles.detailSlotShort]}
        >
          <Row gap={8} style={styles.detailMeta}>
            <View style={styles.flex} />
            {node ? (
              <RoundButton
                size={32}
                accessibilityLabel={t("tree.closeDetails")}
                onPress={() => setFocus(null)}
                style={styles.closeDetails}
              >
                <GIcon name="xmark" size={14} color={palette.ivory} />
              </RoundButton>
            ) : null}
          </Row>
          {node ? (
            <Row
              gap={12}
              style={[styles.focus, shortLandscape && styles.focusShort]}
            >
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
              <RoundButton
                size={48}
                accessibilityLabel={t("tree.allocate")}
                selected={canAllocate(hero, node.id)}
                disabled={!canAllocate(hero, node.id)}
                onPress={() => actions.allocateNode(node.id)}
              >
                <GIcon name="plus" size={22} color={palette.amber} />
              </RoundButton>
            </Row>
          ) : (
            <View style={styles.tip}>
              <Label
                value={t("tree.tipTitle")}
                type="headline"
                display
                color={palette.ivory}
              />
              <Label
                value={t("tree.tipBody")}
                type="footnote"
                color={palette.muted}
              />
            </View>
          )}
        </View>
        <View
          style={styles.area}
          onLayout={(e) => setArea(e.nativeEvent.layout)}
        >
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
                  <Svg
                    width={size}
                    height={size}
                    style={StyleSheet.absoluteFill}
                  >
                    {content.tree.edges.map(([a, b]) => {
                      const na = getNode(a);
                      const nb = getNode(b);
                      const lit = allocated.has(a) && allocated.has(b);
                      const near = allocated.has(a) || allocated.has(b);
                      const color = colorOf(lit && attrOf(b) ? b : a);
                      const line = {
                        x1: atX(na.x),
                        y1: atY(na.y),
                        x2: atX(nb.x),
                        y2: atY(nb.y),
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
                      atX={atX}
                      atY={atY}
                      on={allocated.has(n.id)}
                      open={canAllocate(hero, n.id)}
                      focused={focus === n.id}
                      onPress={() =>
                        setFocus((current) => (current === n.id ? null : n.id))
                      }
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
      </View>
    </Workspace>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fill: { flex: 1 },
  treeLayout: { flex: 1 },
  treeLayoutShort: { flexDirection: "row", gap: 12 },
  detailSlot: {
    height: 112,
    flexShrink: 0,
    borderBottomWidth: 1,
    borderColor: palette.lineSoft,
  },
  detailSlotShort: {
    width: 240,
    height: "100%",
    borderBottomWidth: 0,
    borderEndWidth: 1,
    paddingEnd: 8,
  },
  detailMeta: { height: 34, alignItems: "center" },
  closeDetails: { borderWidth: 0, backgroundColor: "transparent" },
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
  focus: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  focusShort: { flexDirection: "column", alignItems: "flex-start", gap: 8 },
  tip: { paddingHorizontal: 4, gap: 2 },
  focusMark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
  },
  diamond: { borderRadius: 4, transform: [{ rotate: "45deg" }] },
});
