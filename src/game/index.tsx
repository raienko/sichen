import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { validateContent } from "./data";
import BattleScreen from "./screens/battle";
import CreateScreen from "./screens/create";
import DeathScreen from "./screens/death";
import TitleScreen from "./screens/title";
import WorldScreen from "./screens/world";
import { anonymousAuth } from "./state/platform";
import * as actions from "./state/actions";
import { runtime } from "./state/runtime";
import { store, useGame } from "./state/store";
import { palette } from "./ui/palette";

if (__DEV__) {
  const errors = validateContent();
  if (errors.length > 0) console.warn("Game content problems:", errors);
  // A handle for poking the game from the browser console while developing.
  (globalThis as Record<string, unknown>).__game = { store, actions, runtime };
}

/** The whole game: one screen at a time, chosen by the store's scene. */
export default function Game() {
  const scene = useGame((s) => s.scene);
  const hasBattle = useGame((s) => s.battle !== null);
  useEffect(() => {
    void anonymousAuth.signIn();
  }, []);
  return (
    <View style={styles.root}>
      {scene.name === "title" ? <TitleScreen /> : null}
      {scene.name === "create" ? <CreateScreen slot={scene.slot} /> : null}
      {scene.name === "world" ? <WorldScreen /> : null}
      {scene.name === "battle" && hasBattle ? <BattleScreen /> : null}
      {scene.name === "death" ? (
        <DeathScreen cards={scene.cards} picked={scene.picked} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.night },
});
