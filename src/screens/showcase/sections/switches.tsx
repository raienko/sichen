import { useState } from "react";
import { View } from "react-native";

import Switch from "@/components/switch";
import { useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";

import Readout from "./readout";

/** Both switch implementations under the same controlled public API. */
export default function SwitchesSection() {
  const { t } = useLocale();
  const styles = useStyles();
  const [custom, setCustom] = useState(false);
  const [expo, setExpo] = useState(true);

  return (
    <View style={styles.container}>
      <Switch label={t("switch.custom")} value={custom} onChange={setCustom} />
      <Switch
        type="expo"
        label={t("switch.expo")}
        value={expo}
        onChange={setExpo}
      />
      <Switch label={t("switch.disabled")} value disabled onChange={() => {}} />
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
