import { useMutation, useQuery } from "@tanstack/react-query";
import { View } from "react-native";

import Button from "@/components/button";
import Text from "@/components/text";
import env from "@/constants/env";
import { api } from "@/features/api";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

/**
 * Public endpoints, called by absolute URL because no brand sets `apiUrl`
 * yet — which is itself the demo: absolute URLs are used as given, and a
 * host that isn't the API's never receives the token.
 */
const TODO_URL = "https://jsonplaceholder.typicode.com/todos/1";
/** Echoes back the request it received, headers included. */
const ECHO_URL = "https://httpbin.org/anything";
const NOT_FOUND_URL = "https://httpbin.org/status/404";

type Todo = { id: number; title: string; completed: boolean };
type Echo = { headers: Record<string, string> };

function time(timestamp: number): string {
  return timestamp === 0 ? "—" : new Date(timestamp).toLocaleTimeString();
}

/**
 * The request client and TanStack Query together: a cached query (persisted
 * to MMKV — relaunch and it's there before the refetch lands), a mutation
 * whose echo shows which headers went out, and a failure turned into an
 * `ApiError`. Every request also shows up in the dev log.
 */
export default function ApiSection() {
  const theme = useTheme();
  const styles = useStyles();

  const todo = useQuery({
    queryKey: ["showcase", "todo"],
    queryFn: ({ signal }) => api.get<Todo>(TODO_URL, { signal }),
  });

  const echo = useMutation({
    mutationFn: () => api.post<Echo>(ECHO_URL, { from: "showcase" }),
  });

  // Not fetched until asked, and not retried: a 404 would only fail again.
  const missing = useQuery({
    queryKey: ["showcase", "missing"],
    queryFn: ({ signal }) => api.get(NOT_FOUND_URL, { signal }),
    enabled: false,
  });

  const echoed = echo.data?.headers ?? {};

  return (
    <View style={styles.container}>
      <Text
        value="api for requests, TanStack Query for caching. With no apiUrl set for this brand, these call public services by absolute URL — the same client, minus the token, which only ever goes to the API's own origin."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />
      <Readout label="env.apiUrl" value={env.apiUrl ?? "not set"} />

      <Text value="Query" type="headline" />
      <Readout
        label="status"
        value={todo.isFetching ? "fetching" : todo.status}
      />
      <Readout label="title" value={todo.data?.title ?? "—"} />
      <Readout label="dataUpdatedAt" value={time(todo.dataUpdatedAt)} />
      <Button value="refetch" onPress={() => void todo.refetch()} />
      <Text
        value="Cached in MMKV: relaunch the app and the title is here at once, then refreshed behind it."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />

      <Text value="Mutation" type="headline" />
      <Button value="POST and echo the headers" onPress={() => echo.mutate()} />
      <Readout label="status" value={echo.status} />
      <Readout label="X-App-Version" value={echoed["X-App-Version"] ?? "—"} />
      <Readout label="X-Platform" value={echoed["X-Platform"] ?? "—"} />
      <Readout
        label="Authorization"
        value={
          echo.data
            ? (echoed.Authorization ?? "not sent (not the API's origin)")
            : "—"
        }
      />

      <Text value="Errors" type="headline" />
      <Button value="GET a 404" onPress={() => void missing.refetch()} />
      <Readout
        label="error.status"
        value={String(missing.error?.status ?? "—")}
      />
      <Readout label="error.message" value={missing.error?.message ?? "—"} />
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x12,
  },
}));
