import { useState } from "react";
import { View } from "react-native";

import Checkbox from "@/components/checkbox";
import { useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";

import Readout from "./readout";

/** Both implementations under the same controlled public API. */
export default function CheckboxesSection() {
  const { t } = useLocale();
  const styles = useStyles();
  const [custom, setCustom] = useState(false);
  const [expo, setExpo] = useState(true);

  return (
    <View style={styles.container}>
      <Checkbox
        label={t("checkbox.custom")}
        value={custom}
        onChange={setCustom}
      />
      <Checkbox
        type="expo"
        label={t("checkbox.expo")}
        value={expo}
        onChange={setExpo}
      />
      <Checkbox
        label={t("checkbox.disabled")}
        value
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
