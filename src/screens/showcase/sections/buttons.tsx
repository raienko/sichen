import { useState } from "react";
import { View } from "react-native";

import BackButton from "@/components/back-button";
import Button, {
  IconButton,
  type ButtonSize,
  type ButtonType,
} from "@/components/button";
import Icon from "@/components/icon";
import { Column } from "@/components/grid";
import Text from "@/components/text";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

const TYPES: ButtonType[] = ["primary", "secondary", "tertiary"];
const SIZES: ButtonSize[] = ["small", "medium", "large", "auto"];
const ICON_SIZES = ["small", "medium", "large"] as const;

/**
 * The full type × size matrix, plus the states that cut across both.
 *
 * Laid out as one row per type so the emphasis order reads top to bottom —
 * filled accent, filled neutral, unfilled — and the sizes line up in
 * columns, which is the easiest way to see that `auto` is the only one that
 * doesn't reserve a touch target.
 *
 * `IconButton` follows, drawing from the same palette and the same heights,
 * which is the point of it sharing them: put one beside a `Button` of the
 * same type and size and they match.
 */
export default function ButtonsSection() {
  const theme = useTheme();
  const { spacing } = useSizes();
  const styles = useStyles();
  const [picked, setPicked] = useState<ButtonType>("secondary");
  const [pressCount, setPressCount] = useState(0);

  return (
    <Column gap={spacing.x12}>
      {TYPES.map((type) => (
        <View key={type} style={styles.group}>
          <Text
            value={type}
            type="footnote"
            style={{ color: theme.colors.textSecondary }}
          />
          <View style={styles.row}>
            {SIZES.map((size) => (
              <Button
                key={size}
                value={size}
                type={type}
                size={size}
                onPress={() => setPressCount((n) => n + 1)}
              />
            ))}
          </View>
        </View>
      ))}

      <Text value="Selected — a segmented control" type="headline" />
      <View style={styles.row}>
        {TYPES.map((type) => (
          <Button
            key={type}
            value={type}
            type={type}
            selected={picked === type}
            onPress={() => setPicked(type)}
          />
        ))}
      </View>
      <Readout label="selected" value={picked} />

      <Text value="Disabled" type="headline" />
      <View style={styles.row}>
        {TYPES.map((type) => (
          <Button
            key={type}
            value={type}
            type={type}
            disabled
            onPress={() => {}}
          />
        ))}
      </View>

      <Text value="Loading" type="headline" />
      <View style={styles.row}>
        {TYPES.map((type) => (
          <Button
            key={type}
            value={type}
            type={type}
            loading
            onPress={() => setPressCount((n) => n + 1)}
          />
        ))}
      </View>

      <Text value="IconButton — same palette, square" type="headline" />
      <View style={styles.row}>
        {TYPES.map((type) => (
          <IconButton
            key={type}
            label={`${type} icon button`}
            type={type}
            onPress={() => setPressCount((n) => n + 1)}
          >
            <Icon name="star" />
          </IconButton>
        ))}
        {/* Beside a Button of the same type and size, to show they line up. */}
        <Button value="secondary" type="secondary" onPress={() => {}} />
      </View>

      <View style={styles.row}>
        {ICON_SIZES.map((size) => (
          <IconButton
            key={size}
            label={`${size} icon button`}
            type="secondary"
            size={size}
            onPress={() => setPressCount((n) => n + 1)}
          >
            <Icon name="heart" />
          </IconButton>
        ))}
        <IconButton label="Selected icon button" type="secondary" selected>
          <Icon name="check" />
        </IconButton>
        <IconButton label="Disabled icon button" type="primary" disabled>
          <Icon name="slash" />
        </IconButton>
      </View>

      <Text
        value="BackButton — an IconButton that pops the stack"
        type="headline"
      />
      <Text
        value="With no onPress it calls router.back(), or replaces with its fallback when there is no history — which is the case here, since the showcase is the only route. Its chevron mirrors in a right-to-left locale."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
      <View style={styles.row}>
        {/* onPress here so the demo doesn't navigate away from the showcase. */}
        <BackButton onPress={() => setPressCount((n) => n + 1)} />
        <BackButton
          type="secondary"
          onPress={() => setPressCount((n) => n + 1)}
        />
        <BackButton
          type="primary"
          size="large"
          onPress={() => setPressCount((n) => n + 1)}
        />
        <BackButton type="secondary" disabled />
      </View>

      <Readout label="presses" value={String(pressCount)} />
    </Column>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  group: {
    gap: spacing.x4,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.x8,
  },
}));
