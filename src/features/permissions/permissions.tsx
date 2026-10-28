import { useEffect, type ReactNode } from "react";
import { AppState } from "react-native";

import logger from "@/features/logger";

import permissions from "./registry";

type Props = {
  children: ReactNode;
};

/**
 * Keeps the persisted permission snapshots synchronized with OS Settings.
 * This owns lifecycle only; permission state itself lives in LocalValue, so
 * consumers do not need a context or this component's internals.
 */
export default function Permissions({ children }: Props) {
  useEffect(() => {
    const refresh = () => {
      void permissions
        .refresh()
        .catch((error) =>
          logger.failed("Unable to refresh permissions", error),
        );
    };

    refresh();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });

    return () => subscription.remove();
  }, []);

  return <>{children}</>;
}
