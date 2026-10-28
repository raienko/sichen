import { setStringAsync } from "expo-clipboard";
import { useEffect, useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import Modal from "@/components/modal";
import Switch from "@/components/switch";
import Text from "@/components/text";
import Toast from "@/components/toast";
import env from "@/constants/env";
import {
  ApiError,
  apiEvents,
  clearPersistedCache,
  queryClient,
} from "@/features/api";
import { device, installId } from "@/features/device";
import { haptics } from "@/features/haptics";
import { useNetworkStatus } from "@/features/network";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { isDebug } from "@/utils";

import { DEV_MENU_ID, devMenu } from "./control";
import { registerTrigger, reload } from "./platform";

/** The app's own API route — see src/app/api/health+api.ts. */
const HEALTH_ROUTE = "/api/health";

function Row({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Text
        value={label}
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />
      <Text value={value} type="footnote" style={styles.value} />
    </View>
  );
}

function Menu() {
  const styles = useStyles();
  const network = useNetworkStatus();
  const hapticsEnabled = haptics.useEnabled();
  const [health, setHealth] = useState("—");

  const pingHealth = async () => {
    setHealth("…");
    try {
      const response = await fetch(HEALTH_ROUTE);
      setHealth(`${response.status} ${await response.text()}`);
    } catch (error) {
      setHealth(String(error));
    }
  };

  const clearCache = () => {
    queryClient.clear();
    clearPersistedCache();
    Toast.show({ type: "success", message: "Query cache cleared" });
  };

  const forceLogout = () => {
    apiEvents.emit(
      "forceLogout",
      new ApiError({ message: "Forced from the dev menu", status: 401 }),
    );
    Toast.show({ type: "info", message: "forceLogout emitted" });
  };

  const copyInstallId = async () => {
    await setStringAsync(installId());
    Toast.show({ type: "success", message: "Install id copied" });
  };

  return (
    <View style={styles.container}>
      <Text value="Dev menu" type="title3" />

      <Text value="App" type="headline" />
      <Row
        label="version"
        value={`${device.appVersion} (${device.buildNumber})`}
      />
      <Row label="platform" value={`${device.osName} ${device.osVersion}`} />
      <Row label="apiUrl" value={env.apiUrl ?? "not set"} />
      <Row
        label="network"
        value={`${network.isOnline ? "online" : "offline"} · ${network.type}`}
      />
      <Row label="installId" value={installId()} />

      <Text value="API" type="headline" />
      <Button value={`GET ${HEALTH_ROUTE}`} onPress={pingHealth} />
      <Row label="response" value={health} />
      <Button value="clear query cache" onPress={clearCache} />
      <Button value="emit forceLogout" onPress={forceLogout} />

      <Text value="Tools" type="headline" />
      <Switch
        label="Haptic feedback"
        value={hapticsEnabled}
        onChange={haptics.setEnabled}
      />
      <Button value="copy install id" onPress={copyInstallId} />
      <Button
        value="show a toast"
        onPress={() =>
          Toast.show({ type: "info", message: "Hello from the dev menu" })
        }
      />
      <Button value="reload app" onPress={reload} />
      <Button value="close" type="primary" onPress={devMenu.close} />
    </View>
  );
}

/**
 * The in-app dev menu: what the app knows about itself, and shortcuts that
 * would otherwise take a debugger. Mounted once, in Root; development
 * builds only — in production it renders nothing and registers nothing.
 */
export default function DevMenu() {
  useEffect(() => (isDebug ? registerTrigger(devMenu.open) : undefined), []);

  if (!isDebug) return null;
  return (
    <Modal id={DEV_MENU_ID} type="bottomSheet">
      <Menu />
    </Modal>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.x12,
  },
  value: {
    flexShrink: 1,
    textAlign: "right",
  },
}));
