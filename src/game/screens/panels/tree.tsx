import { useState } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import Svg, { Line } from "react-native-svg";

import { content, getNode } from "../../data";
import { useT } from "../../i18n";
import * as actions from "../../state/actions";
import type { SaveData } from "../../state/save";
import { canAllocate, treePointsLeft } from "../../sim/hero";
import { useModLines } from "../../ui/items";
import { GButton, Label, Row, Sheet } from "../../ui/kit";
import { palette } from "../../ui/palette";

const ATTR_COLOR = { str: "#c0503a", dex: "#5fae5a", int: "#4a7ad8" } as const;

function nodeColor(id: string): string {
  if (id.startsWith("str")) return ATTR_COLOR.str;
  if (id.startsWith("dex")) return ATTR_COLOR.dex;
  if (id.startsWith("int")) return ATTR_COLOR.int;
  return palette.gold;
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
  const { width, height } = useWindowDimensions();
  const [focus, setFocus] = useState<string | null>(null);
  const { hero } = save;
  const size = Math.max(260, Math.min(width - 60, height - 190, 560));
  const k = size / 14;
  const at = (v: number) => size / 2 + v * k;
  const allocated = new Set(hero.tree);
  const node = focus ? getNode(focus) : null;

  return (
    <Sheet title={t("menu.tree")} icon="sitemap" onClose={onClose} wide>
      <Row gap={12} wrap>
        <Label
          value={t("tree.points", { points: treePointsLeft(hero) })}
          type="headline"
          color={palette.gold}
        />
        {node ? (
          <View style={styles.focus}>
            <Label
              value={
                node.notable ? tr(node.notable) : lines(node.mods).join(", ")
              }
              type="subheadline"
              color={node.notable ? palette.gold : palette.text}
            />
            {node.notable ? (
              <Label
                value={lines(node.mods).join(", ")}
                type="caption1"
                color={palette.muted}
              />
            ) : null}
          </View>
        ) : null}
        {node && canAllocate(hero, node.id) ? (
          <GButton
            label={t("tree.allocate")}
            icon="plus"
            compact
            tone="primary"
            onPress={() => actions.allocateNode(node.id)}
          />
        ) : null}
      </Row>
      <View style={[styles.board, { width: size, height: size }]}>
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          {content.tree.edges.map(([a, b]) => {
            const na = getNode(a);
            const nb = getNode(b);
            const lit = allocated.has(a) && allocated.has(b);
            return (
              <Line
                key={`${a}-${b}`}
                x1={at(na.x)}
                y1={at(na.y)}
                x2={at(nb.x)}
                y2={at(nb.y)}
                stroke={lit ? palette.gold : palette.lineSoft}
                strokeWidth={lit ? 3 : 2}
              />
            );
          })}
        </Svg>
        {content.tree.nodes.map((n) => {
          const r = n.notable ? 15 : n.start ? 13 : 9;
          const on = allocated.has(n.id);
          const open = canAllocate(hero, n.id);
          return (
            <Pressable
              key={n.id}
              accessibilityLabel={
                n.notable ? tr(n.notable) : lines(n.mods).join(", ")
              }
              onPress={() => setFocus(n.id)}
              style={[
                styles.node,
                {
                  left: at(n.x) - r,
                  top: at(n.y) - r,
                  width: r * 2,
                  height: r * 2,
                  borderRadius: n.notable ? 4 : r,
                  backgroundColor: on ? nodeColor(n.id) : palette.night,
                  borderColor:
                    focus === n.id
                      ? palette.white
                      : open
                        ? palette.gold
                        : nodeColor(n.id),
                  borderWidth: focus === n.id || open ? 2 : 1,
                  opacity: on || open ? 1 : 0.6,
                  transform: n.notable ? [{ rotate: "45deg" }] : [],
                },
              ]}
            />
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  board: { alignSelf: "center" },
  node: { position: "absolute" },
  focus: { flex: 1, minWidth: 160, gap: 2 },
});
