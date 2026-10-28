import { useState } from "react";
import type { PermissionResponse } from "expo";
import { View } from "react-native";

import Button from "@/components/button";
import Text from "@/components/text";
import logger from "@/features/logger";
import { permissions, type Permission } from "@/features/permissions";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

type PermissionApi<Response extends PermissionResponse> = Pick<
  Permission<Response>,
  "useValue" | "refresh" | "request"
>;

type PermissionCardProps<Response extends PermissionResponse> = {
  name: string;
  permission: PermissionApi<Response>;
};

type PermissionAction = "refresh" | "request";

function PermissionCard<Response extends PermissionResponse>({
  name,
  permission,
}: PermissionCardProps<Response>) {
  const response = permission.useValue();
  const [pending, setPending] = useState<PermissionAction>();
  const styles = useStyles();

  const run = async (action: PermissionAction) => {
    setPending(action);
    try {
      await permission[action]();
    } catch (error) {
      logger.failed(`Unable to ${action} ${name} permission`, error);
    } finally {
      setPending(undefined);
    }
  };

  return (
    <View style={styles.permission}>
      <Text value={name} type="headline" />
      <Readout label="status" value={response?.status ?? "not loaded"} />
      <Readout label="granted" value={String(response?.granted ?? false)} />
      <Readout
        label="canAskAgain"
        value={String(response?.canAskAgain ?? false)}
      />
      <View style={styles.actions}>
        <Button
          value="refresh"
          loading={pending === "refresh"}
          disabled={pending !== undefined && pending !== "refresh"}
          onPress={() => void run("refresh")}
        />
        <Button
          value="request"
          loading={pending === "request"}
          disabled={pending !== undefined && pending !== "request"}
          onPress={() => void run("request")}
        />
      </View>
    </View>
  );
}

/** Live LocalValue snapshots plus every operation in the permissions API. */
export default function PermissionsSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [refreshingAll, setRefreshingAll] = useState(false);

  const refreshAll = async () => {
    setRefreshingAll(true);
    try {
      await permissions.refresh();
    } catch (error) {
      logger.failed("Unable to refresh permissions", error);
    } finally {
      setRefreshingAll(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text
        value="Permission responses are persisted with LocalValue and refreshed whenever the app becomes active."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />
      <Button
        value="refresh all"
        loading={refreshingAll}
        onPress={() => void refreshAll()}
      />
      <PermissionCard name="camera" permission={permissions.camera} />
      <PermissionCard name="gallery" permission={permissions.gallery} />
      <PermissionCard name="location" permission={permissions.location} />
      <PermissionCard
        name="notifications"
        permission={permissions.notifications}
      />
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x16,
  },
  permission: {
    gap: spacing.x8,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.x8,
  },
}));
