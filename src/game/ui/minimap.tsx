import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, G, Rect } from "react-native-svg";

import { getZone } from "../data";
import { runtime } from "../state/runtime";
import type { SaveData } from "../state/save";

import { palette } from "./palette";

const COLORS: Record<string, string> = {
  "#": "#1f3424",
  r: "#4a4740",
  "~": "#1e3a52",
  h: "#8a7a5a",
  W: "#5a4028",
  c: "#c9b880",
  t: "#6a4a2a",
  "=": "#5a4a34",
};

/** Run-length rows, so a 48×36 map is a few hundred rects, not 1700. */
function runs(map: readonly string[]) {
  const out: { x: number; z: number; w: number; color: string }[] = [];
  map.forEach((row, z) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x]!;
      let w = 1;
      while (row[x + w] === ch) w += 1;
      const color = COLORS[ch];
      if (color) out.push({ x, z, w, color });
      x += w;
    }
  });
  return out;
}

export function Minimap({
  save,
  size = 128,
}: {
  save: SaveData;
  size?: number;
}) {
  const zone = getZone(save.world.zoneId);
  const width = zone.map[0]?.length ?? 1;
  const height = zone.map.length;
  const rects = useMemo(() => runs(zone.map), [zone.map]);
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 250);
    return () => clearInterval(id);
  }, []);
  const scale = size / Math.max(width, height);
  const packs = zone.packs.filter(
    (p) => !p.quest && !save.world.cleared.includes(p.id),
  );
  return (
    <View
      style={[
        styles.frame,
        { width: width * scale + 4, height: height * scale + 4 },
      ]}
    >
      <Svg width={width * scale} height={height * scale}>
        <Rect
          x={0}
          y={0}
          width={width * scale}
          height={height * scale}
          fill="#2a3022"
        />
        <G scale={scale}>
          {rects.map((r, i) => (
            <Rect
              key={i}
              x={r.x - 0.5}
              y={r.z - 0.5}
              width={r.w}
              height={1}
              fill={r.color}
            />
          ))}
          {zone.exits.map((e, i) => (
            <Circle key={`e${i}`} cx={e.x} cy={e.z} r={0.9} fill="#6ad0ff" />
          ))}
          {zone.npcs.map((n) => (
            <Circle
              key={n.npcId}
              cx={n.x}
              cy={n.z}
              r={0.6}
              fill={palette.gold}
            />
          ))}
          {zone.interactables.map((it) => (
            <Circle key={it.id} cx={it.x} cy={it.z} r={0.7} fill="#e0e0e0" />
          ))}
          {packs.map((p) => {
            const mob = runtime.mobs.get(p.id);
            return (
              <Circle
                key={p.id}
                cx={mob?.x ?? p.x}
                cy={mob?.z ?? p.z}
                r={p.id === "p_likho" ? 1.1 : 0.7}
                fill={p.id === "p_likho" ? "#b04ae8" : palette.bad}
              />
            );
          })}
          <Circle
            cx={runtime.x}
            cy={runtime.z}
            r={0.9}
            fill="#ffffff"
            stroke="#000000"
            strokeWidth={0.3}
          />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    padding: 2,
    backgroundColor: palette.night,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: 6,
    overflow: "hidden",
  },
});
