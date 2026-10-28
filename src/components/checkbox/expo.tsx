import { Checkbox as ExpoCheckbox } from "@expo/ui";
import { Platform, View } from "react-native";

import ExpoUIHost from "@/components/expo-ui-host";
import { createStyles } from "@/features/responsive";
import { isAndroid, isIOS } from "@/utils";

import CheckboxRow from "./row";
import type {
  CheckboxImplementationProps,
  CheckboxIndicatorProps,
} from "./types";

/**
 * Native hosts need an explicit frame. Expo UI's iOS "checkbox" is a SwiftUI
 * `Toggle`, i.e. a UISwitch, which would spill over the label from a
 * checkbox-sized slot; Compose pads its box to a 48dp touch target. Web
 * keeps the checkbox-sized slot and sizes the host to its contents.
 */
const nativeSlot = isAndroid
  ? // Material 3 checkbox inside its native minimum interactive canvas.
    { slot: { width: 48, height: 48 }, host: { width: 48, height: 48 } }
  : isIOS
    ? {
        // From iOS 26 the track draws 63pt wide, overflowing its frame on
        // the trailing side, so the slot reserves what is actually drawn.
        slot: {
          width: Number.parseInt(String(Platform.Version), 10) >= 26 ? 63 : 51,
          height: 44,
        },
        // UISwitch reports a 51×31pt frame on every release.
        host: { width: 51, height: 44 },
      }
    : null;

/**
 * Expo UI's universal checkbox: SwiftUI on iOS, Jetpack Compose on Android,
 * and its web implementation in the browser. `ExpoUIHost` supplies the
 * app-wide color scheme, seed color, and layout direction.
 */
function ExpoIndicator({ value, disabled }: CheckboxIndicatorProps) {
  const styles = useStyles();

  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.slot, nativeSlot && [styles.nativeSlot, nativeSlot.slot]]}
    >
      <ExpoUIHost
        matchContents={nativeSlot === null}
        ignoreSafeArea="all"
        style={nativeSlot?.host}
      >
        <ExpoCheckbox
          value={value}
          onValueChange={() => {}}
          disabled={disabled}
        />
      </ExpoUIHost>
    </View>
  );
}

/** Expo UI checkbox indicator inside the app-owned typed and themed row. */
export default function ExpoUICheckbox(props: CheckboxImplementationProps) {
  return <CheckboxRow {...props} Indicator={ExpoIndicator} />;
}

const useStyles = createStyles(({ isRTL, spacing, sizes }) => ({
  slot: {
    width: spacing.x24,
    height: sizes.elementHeightMd,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  nativeSlot: {
    // Pin the native frame to the row's start so any trailing overflow
    // stays inside the slot rather than reaching the label.
    alignItems: isRTL ? "flex-end" : "flex-start",
  },
}));
