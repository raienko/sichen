import { View } from "react-native";

import Button from "@/components/button";
import Text from "@/components/text";
import Toast, { TOAST_TYPES, toasts, useToasts } from "@/components/toast";
import { deepLinks } from "@/features/deep-links";
import { useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

/**
 * Registered at module scope, not in an effect, so the link a toast points
 * at still resolves while this section is collapsed (Accordion unmounts its
 * content) — a toast outlives the screen that raised it, which is the whole
 * reason its action is a link rather than a callback.
 */
deepLinks.register({
  pattern: "/showcase/toasts/upload/:id",
  handle: ({ params }) => void Toast.success(`Opened upload ${params.id}`),
});

/** Raising toasts every way there is, and watching the queue drain. */
export default function ToastsSection() {
  const theme = useTheme();
  const styles = useStyles();
  const { t } = useLocale();
  const entries = useToasts();
  // `useToasts` re-renders this on every change to the list; the queue
  // behind it changes at exactly those moments, so it's read here rather
  // than mirrored into state of its own.
  const queued = toasts.queued().length;

  const showLinked = () =>
    void Toast.show({
      type: "error",
      title: t("toast.showcase.errorTitle"),
      message: t("toast.showcase.errorMessage"),
      link: "/showcase/toasts/upload/42",
      actionLabel: t("toast.showcase.action"),
      duration: null,
    });

  const showSticky = () =>
    void Toast.show({
      type: "warning",
      message: t("toast.showcase.sticky"),
      duration: null,
    });

  const showExpiring = () =>
    void Toast.show({
      type: "info",
      message: t("toast.showcase.expiring"),
      // The same toast could equally say `expiresAt: Date.now() + 3000` —
      // `duration` is the countdown spelling of the same moment.
      duration: 3000,
    });

  const showBurst = () => {
    for (let index = 1; index <= 6; index += 1) {
      void Toast.info(`${index} / 6`, { duration: 1500 * index });
    }
  };

  return (
    <View style={styles.container}>
      <Text
        value="Raised from anywhere with no ref and no context — the list lives outside React, and ToastsProvider renders it above every screen."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <View style={styles.actions}>
        {TOAST_TYPES.map((type) => (
          <Button
            key={type}
            value={type}
            size="small"
            onPress={() => void Toast[type](t("toast.showcase.message"))}
          />
        ))}
      </View>

      <Button
        value="with a link (opens through the deep-link pipeline)"
        type="primary"
        onPress={showLinked}
      />
      <Button value="that stays until closed" onPress={showSticky} />
      <Button value="that expires in three seconds" onPress={showExpiring} />
      <Button value="six at once (three queue)" onPress={showBurst} />

      <Readout label="on screen" value={String(entries.length)} />
      <Readout label="waiting for a slot" value={String(queued)} />

      <Button value="hide all" onPress={() => void Toast.hideAll()} />
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x12,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.x8,
  },
}));
