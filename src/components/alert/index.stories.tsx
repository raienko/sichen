import { useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import { createStyles } from "@/features/responsive";

import Component from "./index";

const meta = {
  title: "components/Alert",
  component: Component,
};

export default meta;

export function Types() {
  const styles = useStyles();

  return (
    <View style={styles.stack}>
      <Component type="info" message="Your plan renews on October 1." />
      <Component type="success" message="Email verified." />
      <Component
        type="warning"
        message="You're offline. Changes will sync when you reconnect."
      />
      <Component type="error" message="We couldn't load your orders." />
    </View>
  );
}

export function WithTitleAndAction() {
  return (
    <Component
      type="error"
      title="Couldn't save"
      message="Check your connection and try again."
      action={{ label: "Retry", onPress: () => {} }}
    />
  );
}

export function Dismissible() {
  const styles = useStyles();
  const [shown, setShown] = useState(true);

  return (
    <View style={styles.stack}>
      {shown ? (
        <Component
          type="info"
          title="New: dark mode"
          message="Switch it on under Settings › Appearance."
          onDismiss={() => setShown(false)}
        />
      ) : (
        <Button value="Show again" onPress={() => setShown(true)} />
      )}
    </View>
  );
}

export function LongMessage() {
  return (
    <Component
      type="warning"
      title="Verify your email"
      message="We sent a link to ada@example.com. Until you open it, receipts and password resets can't reach you, and your account will be limited after seven days."
      action={{ label: "Resend link", onPress: () => {} }}
      onDismiss={() => {}}
    />
  );
}

const useStyles = createStyles(({ spacing }) => ({
  stack: {
    gap: spacing.x12,
  },
}));
