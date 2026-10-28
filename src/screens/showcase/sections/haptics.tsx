import { View } from "react-native";

import Button from "@/components/button";
import Switch from "@/components/switch";
import Text from "@/components/text";
import { haptics, type ImpactStrength } from "@/features/haptics";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

const STRENGTHS: ImpactStrength[] = [
  "light",
  "medium",
  "heavy",
  "soft",
  "rigid",
];

/** Every kind of feedback, and the one setting that turns them all off. */
export default function HapticsSection() {
  const theme = useTheme();
  const styles = useStyles();
  const hint = { color: theme.colors.textSecondary };
  const enabled = haptics.useEnabled();

  return (
    <View style={styles.container}>
      <Text
        value="Every kind of feedback, plus the setting that turns them all off. Felt on a phone; silent on web and in the simulator."
        type="footnote"
        style={hint}
      />
      <Switch
        label="Haptic feedback"
        value={enabled}
        onChange={haptics.setEnabled}
      />

      <Text value="Events" type="headline" />
      <View style={styles.row}>
        <Button value="tap" onPress={haptics.tap} />
        <Button value="selection" onPress={haptics.selection} />
        <Button value="success" onPress={haptics.success} />
        <Button value="warning" onPress={haptics.warning} />
        <Button value="error" onPress={haptics.error} />
      </View>

      <Text value="impact(strength)" type="headline" />
      <View style={styles.row}>
        {STRENGTHS.map((strength) => (
          <Button
            key={strength}
            value={strength}
            onPress={() => haptics.impact(strength)}
          />
        ))}
      </View>
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x12,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.x8,
  },
}));
