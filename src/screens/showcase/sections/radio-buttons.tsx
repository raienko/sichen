import { useState } from "react";
import { View } from "react-native";

import RadioButton from "@/components/radio-button";
import { useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";

import Readout from "./readout";

/** Both radio-button implementations under the same controlled public API. */
export default function RadioButtonsSection() {
  const { t } = useLocale();
  const styles = useStyles();
  const [custom, setCustom] = useState(false);
  const [expo, setExpo] = useState(true);

  return (
    <View style={styles.container}>
      <RadioButton
        label={t("radioButton.custom")}
        value={custom}
        onChange={setCustom}
      />
      <RadioButton
        type="expo"
        label={t("radioButton.expo")}
        value={expo}
        onChange={setExpo}
      />
      <RadioButton
        label={t("radioButton.disabled")}
        value={false}
        disabled
        onChange={() => {}}
      />
      <Readout label="custom" value={String(custom)} />
      <Readout label="expo" value={String(expo)} />
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x8,
  },
}));
