import { onlineManager } from "@tanstack/react-query";
import { useEffect, useState, useSyncExternalStore } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import Text from "@/components/text";
import {
  getNetworkStatus,
  onNetworkChange,
  useNetworkStatus,
  type NetworkStatus,
} from "@/features/network";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

const describe = (status: NetworkStatus) =>
  `${status.isOnline ? "online" : "offline"} · ${status.type}`;

const subscribeQueryOnline = (listener: () => void) =>
  onlineManager.subscribe(listener);
const isQueryOnline = () => onlineManager.isOnline();

/** The connection as the app sees it, live, and what TanStack Query makes of it. */
export default function NetworkSection() {
  const theme = useTheme();
  const styles = useStyles();
  const hint = { color: theme.colors.textSecondary };
  const status = useNetworkStatus();
  const queryOnline = useSyncExternalStore(subscribeQueryOnline, isQueryOnline);
  const [checked, setChecked] = useState("—");
  const [changes, setChanges] = useState<string[]>([]);

  useEffect(
    () =>
      onNetworkChange((next) =>
        setChanges((current) =>
          [
            `${new Date().toLocaleTimeString()} — ${describe(next)}`,
            ...current,
          ].slice(0, 5),
        ),
      ),
    [],
  );

  return (
    <View style={styles.container}>
      <Text
        value="The connection as the app sees it, live — toggle airplane mode or Wi-Fi to watch it change."
        type="footnote"
        style={hint}
      />

      <Text value="useNetworkStatus()" type="headline" />
      <Readout label="isOnline" value={String(status.isOnline)} />
      <Readout label="isConnected" value={String(status.isConnected)} />
      <Readout
        label="isInternetReachable"
        value={String(status.isInternetReachable)}
      />
      <Readout label="type" value={status.type} />
      <Readout label="TanStack Query online" value={String(queryOnline)} />

      <Text value="getNetworkStatus()" type="headline" />
      <Button
        value="check now"
        onPress={async () => setChecked(describe(await getNetworkStatus()))}
      />
      <Readout label="result" value={checked} />

      <Text value="onNetworkChange()" type="headline" />
      <Readout
        label="last changes"
        value={changes.length > 0 ? changes.join("\n") : "none yet"}
      />
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x12,
  },
}));
