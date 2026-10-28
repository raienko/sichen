import { useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import Alert from "@/components/alert";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

/** Every type, a title with an action, and one that can be dismissed. */
export default function AlertsSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [dismissed, setDismissed] = useState(false);
  const [retries, setRetries] = useState(0);

  return (
    <View style={styles.container}>
      <Text
        value="In the page, not over it: it stays until what it reports stops being true. Toast leaves on its own and Popup blocks; this does neither."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <Alert type="info" message="Your plan renews on October 1." />
      <Alert type="success" message="Email verified." />
      <Alert
        type="warning"
        message="You're offline. Changes will sync when you reconnect."
      />
      <Alert
        type="error"
        title="Couldn't save"
        message={
          retries === 0
            ? "Check your connection and try again."
            : `Still failing after ${retries} ${retries === 1 ? "retry" : "retries"}.`
        }
        action={{ label: "Retry", onPress: () => setRetries((n) => n + 1) }}
      />

      {dismissed ? (
        <Button
          value="Show the dismissible one again"
          onPress={() => setDismissed(false)}
        />
      ) : (
        <Alert
          type="info"
          title="New: dark mode"
          message="Switch it on under Theme & colors."
          onDismiss={() => setDismissed(true)}
        />
      )}
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x12,
  },
}));
