import { Switch as ExpoSwitch } from "@expo/ui";
import { StyleSheet, View } from "react-native";

import ExpoUIHost from "@/components/expo-ui-host";
import { isAndroid, isIOS } from "@/utils";

import SwitchRow from "./row";
import type { SwitchImplementationProps, SwitchIndicatorProps } from "./types";

const switchSize = isAndroid
  ? // Material 3 switch plus its native minimum interactive canvas.
    { width: 52, height: 48 }
  : isIOS
    ? // UISwitch is 51×31pt; retain a little vertical native breathing room.
      { width: 51, height: 44 }
    : // Expo UI's web track has a 36×22 CSS-pixel intrinsic size.
      { width: 36, height: 22 };

function ExpoIndicator({ value, disabled }: SwitchIndicatorProps) {
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={styles.slot}
    >
      <ExpoUIHost ignoreSafeArea="all" style={styles.host}>
        <ExpoSwitch
          value={value}
          disabled={disabled}
          onValueChange={() => {}}
        />
      </ExpoUIHost>
    </View>
  );
}

/** Expo UI switch on every platform, with our own stable labelled row. */
export default function ExpoUISwitch(props: SwitchImplementationProps) {
  return <SwitchRow {...props} Indicator={ExpoIndicator} />;
}

const styles = StyleSheet.create({
  slot: {
    ...switchSize,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  host: {
    ...switchSize,
  },
});
