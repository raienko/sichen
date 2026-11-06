import { StyleSheet, View } from "react-native";

import { palette } from "./palette";

/** A quiet separator that keeps the dialogue and popup rhythm consistent. */
export function OrnamentRule() {
  return <View style={styles.line} />;
}

const styles = StyleSheet.create({
  line: { width: "100%", height: 1, backgroundColor: palette.lineSoft },
});
