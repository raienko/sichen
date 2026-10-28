import { View } from "react-native";

import Button from "@/components/button";
import { createStyles } from "@/features/responsive";

import Component from "./index";
import { TOAST_TYPES } from "./types";

const meta = {
  title: "components/Toast",
  component: Component,
};

export default meta;

/**
 * `Providers` mounts `ToastsProvider`, and every story is wrapped in it —
 * so `Toast.show()` here puts a real toast over the story, exactly as it
 * would over a screen.
 */
export const Raised = () => {
  const styles = useStyles();

  return (
    <View style={styles.actions}>
      {TOAST_TYPES.map((type) => (
        <Button
          key={type}
          value={type}
          size="small"
          onPress={() => void Component[type](`This is a "${type}" toast.`)}
        />
      ))}
    </View>
  );
};

/** Pressing it dispatches the link through the deep-link pipeline. */
export const WithLink = () => (
  <Button
    value="Show a toast with a link"
    type="primary"
    onPress={() =>
      void Component.show({
        type: "error",
        title: "Upload failed",
        message: "Tap to see what went wrong.",
        link: "/showcase/toasts/upload/42",
        actionLabel: "View",
        duration: null,
      })
    }
  />
);

/** No expiry at all — it waits for its close control, or for `Toast.hide`. */
export const Sticky = () => (
  <Button
    value="Show a toast that stays"
    onPress={() =>
      void Component.show({
        type: "warning",
        message: "This one stays until you close it.",
        duration: null,
      })
    }
  />
);

/**
 * Six at once, against a MAX_VISIBLE of three: the rest queue and are
 * promoted as the ones above them expire.
 */
export const Queued = () => (
  <Button
    value="Show six at once"
    onPress={() => {
      for (let index = 1; index <= 6; index += 1) {
        void Component.info(`Toast ${index} of 6`, { duration: 1500 * index });
      }
    }}
  />
);

/** Rendered directly, with no store behind it — a fixed, inline notice. */
export const Inline = () => (
  <Component
    type="info"
    title="Inline"
    message="Rendered in the layout rather than over it, so it has no lifetime of its own."
    dismissible={false}
  />
);

const useStyles = createStyles(({ spacing }) => ({
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.x8,
  },
}));
