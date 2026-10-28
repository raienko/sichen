import { RadioButton as ExpoRadioButton } from "@expo/ui/jetpack-compose";
import { View } from "react-native";

import ExpoUIHost from "@/components/expo-ui-host";
import { createStyles } from "@/features/responsive";

import RadioButtonRow from "../row";
import type {
  RadioButtonImplementationProps,
  RadioIndicatorProps,
} from "../types";

function ExpoIndicator({ selected }: RadioIndicatorProps) {
  const styles = useStyles();

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={styles.slot}
    >
      <ExpoUIHost ignoreSafeArea="all" style={styles.host}>
        <ExpoRadioButton selected={selected} />
      </ExpoUIHost>
    </View>
  );
}

/** Expo UI's native Material 3 radio button on Android. */
export default function ExpoUIRadioButton(
  props: RadioButtonImplementationProps,
) {
  return <RadioButtonRow {...props} Indicator={ExpoIndicator} />;
}

const useStyles = createStyles(({ spacing, sizes }) => ({
  slot: {
    // Keep Compose's 44pt canvas centered inside the same 24pt layout slot
    // used by the custom and iOS indicators. Its overflow is visual only;
    // the surrounding Pressable owns interaction and accessibility.
    width: spacing.x24,
    height: sizes.elementHeightMd,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  host: {
    width: sizes.elementHeightMd,
    height: sizes.elementHeightMd,
  },
}));
