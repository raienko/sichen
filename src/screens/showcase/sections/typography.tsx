import { View } from "react-native";

import Text from "@/components/text";
import { createStyles, TYPOGRAPHY_TOKENS } from "@/features/responsive";

/**
 * Every entry in the type scale, rendered at its own size and labelled with
 * its token name. Reads top to bottom as the hierarchy it encodes — and the
 * four title sizes are real headings here, so a screen reader can navigate
 * this section by them.
 */
export default function TypographySection() {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      {TYPOGRAPHY_TOKENS.map((token) => (
        <Text key={token} value={token} type={token} />
      ))}
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x8,
  },
}));
