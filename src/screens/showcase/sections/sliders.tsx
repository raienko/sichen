import { useState } from "react";
import { View } from "react-native";

import Slider from "@/components/slider";
import { useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";

import Readout from "./readout";

/** Single, Expo UI, and arbitrary multi-thumb slider variations. */
export default function SlidersSection() {
  const { t } = useLocale();
  const styles = useStyles();
  const [custom, setCustom] = useState(35);
  const [expo, setExpo] = useState(65);
  const [multiple, setMultiple] = useState([20, 50, 80]);

  return (
    <View style={styles.container}>
      <Slider
        label={t("slider.custom")}
        value={custom}
        max={100}
        onChange={setCustom}
      />
      <Slider
        type="expo"
        label={t("slider.expo")}
        value={expo}
        max={100}
        onChange={setExpo}
      />
      <Slider
        label={t("slider.multiple")}
        value={multiple}
        max={100}
        onChange={setMultiple}
        thumbLabels={[
          t("slider.multipleFirst"),
          t("slider.multipleSecond"),
          t("slider.multipleThird"),
        ]}
      />
      <Slider
        label={t("slider.disabled")}
        value={50}
        max={100}
        onChange={() => {}}
        disabled
      />

      <Readout label="custom" value={String(custom)} />
      <Readout label="expo" value={String(expo)} />
      <Readout label="multiple" value={multiple.join(", ")} />
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x12,
  },
}));
