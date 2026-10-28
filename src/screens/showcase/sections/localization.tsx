import { View } from "react-native";

import LocaleSwitcher from "@/components/locale-switcher";
import Text from "@/components/text";
import { useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";

import Readout from "./readout";

/**
 * The locale switcher plus a translated sentence, so picking a language
 * shows `t()` resolving live rather than just changing a setting. Choosing
 * Arabic also flips the whole app to RTL — every row in every section,
 * including this one's own label/value alignment.
 */
export default function LocalizationSection() {
  const { t, locale, preference, isRTL } = useLocale();
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <LocaleSwitcher />

      <Text value={t("showcase.sampleSentence")} type="callout" />

      <Readout label="locale" value={locale} />
      <Readout label="preference" value={preference} />
      <Readout label="isRTL" value={String(isRTL)} />
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x12,
  },
}));
