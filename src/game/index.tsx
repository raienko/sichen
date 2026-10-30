import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/features/theme";

import { validateContent } from "./data";
import BattleScreen from "./screens/battle";
import CreateScreen from "./screens/create";
import DeathScreen from "./screens/death";
import TitleScreen from "./screens/title";
import WorldScreen from "./screens/world";
import { anonymousAuth } from "./state/platform";
import { fullscreenOnFirstTap } from "./ui/fullscreen";
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
  // Web: no tabs or address bar once the player first taps.
  useEffect(fullscreenOnFirstTap, []);
  // The game always plays dark; pinning the app theme keeps the browser and
  // installed-app chrome (theme-color) and system UI dark with it.
  const { preference, setPreference } = useTheme();
  useEffect(() => {
    if (preference !== "dark") setPreference("dark");
  }, [preference, setPreference]);
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
