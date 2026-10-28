import { useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import Input from "@/components/input";
import Spacer, { type SpacerDirection } from "@/components/spacer";
import Text from "@/components/text";
import {
  createStyles,
  useSizes,
  type SpacingToken,
} from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { useKeyboard } from "@/utils";

import Readout from "./readout";

const DIRECTIONS: SpacerDirection[] = ["vertical", "horizontal", "both"];
const SIZES: SpacingToken[] = ["x4", "x8", "x16", "x24", "x40"];

/** The two tinted blocks a spacer is demonstrated between. */
function Block({ label }: { label: string }) {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <View
      style={[
        styles.block,
        { backgroundColor: theme.colors.backgroundElementSelected },
      ]}
    >
      <Text value={label} type="caption2" />
    </View>
  );
}

/**
 * A gap is invisible, so the demo is really the two blocks either side of
 * it: change the direction or the step and watch them move apart on the
 * axis you picked.
 *
 * The container is a row for `horizontal`/`both` and a column for
 * `vertical`, because a gap only separates anything along its parent's own
 * main axis — a vertical spacer in a row is 16pt tall and 0 wide, which
 * moves nothing. That's the one thing worth seeing here.
 */
export default function SpacerSection() {
  const theme = useTheme();
  const styles = useStyles();
  const { spacing } = useSizes();
  const [direction, setDirection] = useState<SpacerDirection>("vertical");
  const [size, setSize] = useState<SpacingToken>("x16");
  const [note, setNote] = useState("");
  const keyboard = useKeyboard();

  return (
    <View style={styles.container}>
      <Text
        value="An explicit gap between two elements, for the places a parent's gap can't express an uneven step. It is hidden from screen readers on every platform — there is nothing in it to announce."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <View style={styles.actions}>
        {DIRECTIONS.map((option) => (
          <Button
            key={option}
            value={option}
            size="small"
            selected={option === direction}
            onPress={() => setDirection(option)}
          />
        ))}
      </View>

      <View style={styles.actions}>
        {SIZES.map((option) => (
          <Button
            key={option}
            value={option}
            size="small"
            selected={option === size}
            onPress={() => setSize(option)}
          />
        ))}
      </View>

      <View
        style={[
          styles.stage,
          direction === "vertical" ? styles.stageColumn : styles.stageRow,
          { borderColor: theme.colors.border },
        ]}
      >
        <Block label="before" />
        <Spacer direction={direction} size={size} />
        <Block label="after" />
      </View>

      <Readout label={`spacing.${size}`} value={String(spacing[size])} />
      <Readout label="direction" value={direction} />
      <Readout
        label="announced by a screen reader"
        value="nothing — aria-hidden"
      />

      <Text value={'size={["x8", "keyboard"]}'} type="headline" />
      <Text
        value="A size can name room something else takes up, and a list takes the tallest. This one is 8pt, and grows with the keyboard frame by frame when it opens. Tinted to show it; focus the field on a phone. On web the keyboard part stays at zero — the browser resizes the page itself."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />
      <Input label="Type something" value={note} onChange={setNote} />
      <Spacer
        size={["x8", "keyboard"]}
        style={{ backgroundColor: theme.colors.backgroundElementSelected }}
      />
      <Readout
        label="keyboard"
        value={keyboard.isVisible ? `${keyboard.height}pt` : "closed"}
      />
    </View>
  );
}

const useStyles = createStyles(({ isRTL, spacing, radius }) => ({
  container: {
    gap: spacing.x8,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.x8,
  },
  stage: {
    borderRadius: radius.surface,
    borderWidth: spacing.x1,
    padding: spacing.x12,
  },
  stageRow: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
  },
  stageColumn: {
    alignItems: isRTL ? "flex-end" : "flex-start",
  },
  block: {
    borderRadius: radius.surface,
    paddingHorizontal: spacing.x8,
    paddingVertical: spacing.x4,
  },
}));
