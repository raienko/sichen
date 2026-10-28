import { useMemo, useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";

import Divider from "@/components/divider";
import { useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";

import { formatDay } from "./format";

type Props = {
  /** Any moment on the day — the separator is for its local day. */
  date: Date | number;
  /** "Now", for the Today/Yesterday decision. Defaults to the current time. */
  now?: Date | number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * The rule between days in a thread: "Today", "Yesterday", "Monday",
 * "12 March", "12 March 2025" — the year only once it isn't this one.
 *
 * A labelled `Divider`, so it's the same hairline every other separation in
 * the kit uses, and the label is read as part of the reading order rather
 * than skipped as decoration.
 *
 * @example <Chat.DateSeparator date={message.createdAt} />
 */
export default function DateSeparator({ date, now, style, testID }: Props) {
  const styles = useStyles();
  const { t, locale } = useLocale();

  const time = typeof date === "number" ? date : date.getTime();
  // Read once, on mount: a separator doesn't need to tick over at midnight
  // while it's on screen, and reading the clock per render isn't pure.
  const [mountedAt] = useState(() => Date.now());
  const reference =
    now === undefined
      ? mountedAt
      : typeof now === "number"
        ? now
        : now.getTime();
  const label = useMemo(
    () => formatDay(time, reference, locale, t),
    [time, reference, locale, t],
  );

  return (
    <Divider
      testID={testID}
      label={label}
      inset="x16"
      style={[styles.separator, style]}
    />
  );
}

const useStyles = createStyles(({ spacing }) => ({
  separator: {
    marginVertical: spacing.x12,
  },
}));
