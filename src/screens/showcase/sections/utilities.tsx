import { useEffect, useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import If from "@/components/if";
import Input from "@/components/input";
import Match from "@/components/match";
import Text from "@/components/text";
import { createEventBus } from "@/features/event-bus";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import {
  seconds,
  useAppState,
  useDebouncedValue,
  useInterval,
  useKeyboard,
  usePrevious,
  useToggle,
} from "@/utils";

import Readout from "./readout";

/**
 * A bus scoped to this section — the point of `createEventBus` being
 * generic is that anything can make its own rather than sharing one global
 * emitter. `Modal`'s id-based `show`/`hide` is the same primitive with a
 * different events map.
 */
const demoBus = createEventBus<{ ping: { at: string } }>();

/** What `Match` below switches over. */
type Status = "loading" | "ready" | "error" | "offline";

const STATUSES: Status[] = ["loading", "ready", "error", "offline"];

/** The small building blocks that don't have a section of their own. */
export default function UtilitiesSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [shown, setShown] = useState(false);
  const [status, setStatus] = useState<Status>("loading");
  const [pings, setPings] = useState(0);
  const [lastPing, setLastPing] = useState("—");
  const [text, setText] = useState("");
  const debouncedText = useDebouncedValue(text, 500);
  const previousText = usePrevious(debouncedText);
  const [ticking, toggleTicking] = useToggle(true);
  const [ticks, setTicks] = useState(0);
  const appState = useAppState();
  const keyboard = useKeyboard();

  useInterval(() => setTicks((n) => n + 1), ticking ? seconds(1) : null);

  useEffect(
    () =>
      demoBus.on("ping", ({ at }) => {
        setPings((n) => n + 1);
        setLastPing(at);
      }),
    [],
  );

  return (
    <View style={styles.container}>
      <Text value="If" type="headline" />
      <Button
        value={shown ? "hide content" : "show content"}
        onPress={() => setShown((current) => !current)}
      />
      <If condition={shown}>
        <Text
          value="Rendered by <If> — no wrapper view, no extra layout node."
          type="footnote"
          style={{ color: theme.colors.textSecondary }}
        />
      </If>

      <Text value="Match" type="headline" />
      <Button
        value={`status: ${status} — cycle`}
        onPress={() =>
          setStatus(
            (current) =>
              STATUSES[(STATUSES.indexOf(current) + 1) % STATUSES.length],
          )
        }
      />
      <Match<Status> value={status}>
        <Match.Case when="loading">
          <Text value="Loading — the first branch matched." type="footnote" />
        </Match.Case>
        <Match.Case when={["error", "offline"]}>
          <Text
            value="Error or offline — one Case, two values, no fall-through."
            type="footnote"
          />
        </Match.Case>
        <Match.Default>
          <Text
            value="Nothing matched, so the Default branch renders."
            type="footnote"
          />
        </Match.Default>
      </Match>

      <Text value="Hooks" type="headline" />
      <Input
        label="Type, then pause"
        placeholder="useDebouncedValue waits 500 ms"
        value={text}
        onChange={setText}
      />
      <Readout
        label="useDebouncedValue(text, 500)"
        value={debouncedText || "—"}
      />
      <Readout label="usePrevious(debounced)" value={previousText || "—"} />
      <Button
        value={ticking ? "pause interval" : "resume interval"}
        onPress={toggleTicking}
      />
      <Readout label="useInterval ticks" value={String(ticks)} />
      <Readout label="useAppState()" value={appState} />
      <Readout
        label="useKeyboard()"
        value={keyboard.isVisible ? `visible, ${keyboard.height}pt` : "hidden"}
      />

      <Text value="Event bus" type="headline" />
      <Button
        value="emit ping"
        onPress={() =>
          demoBus.emit("ping", { at: new Date().toLocaleTimeString() })
        }
      />
      <Readout label="pings received" value={String(pings)} />
      <Readout label="last ping" value={lastPing} />
      <Text
        value="The button emits; a subscriber in this component counts. Neither holds a reference to the other."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x8,
    alignItems: "stretch",
  },
}));
