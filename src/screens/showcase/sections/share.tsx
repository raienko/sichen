import { useState } from "react";
import { View } from "react-native";

import Section from "@/components/section";
import Share, { type ShareOutcome } from "@/components/share";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

const LINK = "https://example.com/order/12";

/** Both actions, and what each of the four outcomes means. */
export default function ShareSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [outcome, setOutcome] = useState<ShareOutcome | null>(null);

  return (
    <View style={styles.container}>
      <Text
        value="Opens the OS share sheet, and copies to the clipboard where there isn't one — which in a desktop browser is most of the time. Both are also available without the button, as Share.share() and Share.copy()."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <Section title="Share, or copy">
        <Text
          value="An icon by default, and the glyph says which of the two it is. They are different actions — one opens a sheet, the other silently fills the clipboard — so they do not share a glyph any more than they would share a label."
          type="caption1"
          style={{ color: theme.colors.textSecondary }}
        />
        <View style={styles.row}>
          <Share
            content={{ url: LINK, title: "Order #12" }}
            type="primary"
            onResult={setOutcome}
          />
          <Share
            content={{ url: LINK }}
            mode="copy"
            type="secondary"
            onResult={setOutcome}
          />
          <Share
            content={{ url: LINK }}
            mode="copy"
            type="tertiary"
            size="small"
            onResult={setOutcome}
          />
        </View>
        <Readout label="outcome" value={outcome ?? "not pressed yet"} />
        <Text
          value="shared — it went somewhere. dismissed — the sheet was closed, which is not a failure. copied — there was no sheet, so the link went to the clipboard instead. failed — nothing happened and nothing was copied."
          type="caption1"
          style={{ color: theme.colors.textSecondary }}
        />
      </Section>

      <Section title="With text instead">
        <Text
          value="Pass value for the cases that need the action spelled out. The accessible name is the same either way, so the icon form is never an unnamed control."
          type="caption1"
          style={{ color: theme.colors.textSecondary }}
        />
        <View style={styles.row}>
          <Share
            content={{ url: LINK }}
            value="Share this order"
            type="primary"
            onResult={setOutcome}
          />
          <Share
            content={{ url: LINK }}
            mode="copy"
            value="Copy link"
            onResult={setOutcome}
          />
        </View>
      </Section>

      <Section title="What gets copied">
        <Text
          value={`The link on its own — ${LINK} — not the message wrapped around it. The clipboard is nearly always on its way into an address bar or a chat box, where “Check this out https://…” is wrong in a way the bare link never is.`}
          type="caption1"
          style={{ color: theme.colors.textSecondary }}
        />
        <View style={styles.row}>
          <Share
            content={{ message: "Check this out", url: LINK }}
            mode="copy"
            value="Copy (message + link)"
            size="small"
            onResult={setOutcome}
          />
          <Share
            content={{ message: "No link here, just words." }}
            mode="copy"
            value="Copy (message only)"
            size="small"
            onResult={setOutcome}
          />
        </View>
      </Section>

      <Section title="Nothing to share">
        <Text
          value="Reached by a URL that has not loaded yet more often than by a caller getting it wrong — a disabled button beats a share sheet that opens empty."
          type="caption1"
          style={{ color: theme.colors.textSecondary }}
        />
        <View style={styles.row}>
          <Share content={{ url: "" }} value="Nothing to share" size="small" />
        </View>
      </Section>
    </View>
  );
}

const useStyles = createStyles(({ isRTL, spacing }) => ({
  container: {
    gap: spacing.x24,
  },
  row: {
    flexDirection: isRTL ? "row-reverse" : "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.x12,
  },
}));
