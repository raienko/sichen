import { useEffect, useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import Input from "@/components/input";
import Text from "@/components/text";
import env from "@/constants/env";
import {
  deepLinkEvents,
  deepLinks,
  type DeepLink,
} from "@/features/deep-links";
import { createEventBus } from "@/features/event-bus";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

/**
 * How a handled link gets from the registry — which runs outside React,
 * and outside this screen — back onto it. A bus rather than shared state
 * because the section only wants to *watch*; nothing here owns the link.
 */
const handledBus = createEventBus<{ handled: string }>();

function record(name: string, link: DeepLink) {
  const params = Object.entries({ ...link.params, ...link.query })
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(" ");

  handledBus.emit(
    "handled",
    [name, link.path, params].filter(Boolean).join(" · "),
  );
}

/**
 * Registered at module scope, not in an effect, so the links keep working
 * while this section is collapsed (Accordion unmounts its content) and when
 * one arrives from outside the app entirely:
 *
 *   npx uri-scheme open "app://showcase/deep-links/user/42" --ios
 *
 * A real app declares links in src/features/deep-links/routes.ts instead —
 * `register` is for the runtime cases, which a screen-local demo is.
 */
deepLinks.register({
  pattern: "/showcase/deep-links",
  handle: (link) => record("plain", link),
});

deepLinks.register({
  pattern: "/showcase/deep-links/user/:id",
  handle: (link) => record("params", link),
});

deepLinks.register({
  pattern: "/showcase/deep-links/account",
  // Held until the app says someone is signed in — the whole point of the
  // toggle below.
  gates: ["auth"],
  handle: (link) => record("gated", link),
});

const EXAMPLES = [
  `${env.appScheme}://showcase/deep-links?from=showcase`,
  `${env.appScheme}://showcase/deep-links/user/42`,
  `${env.appScheme}://showcase/deep-links/account`,
  "/showcase/deep-links/user/ada%20lovelace",
];

/** The whole pipeline: dispatch a link, gate it, watch it come out. */
export default function DeepLinksSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [url, setUrl] = useState(EXAMPLES[0]);
  const [handled, setHandled] = useState<string[]>([]);
  const [authOpen, setAuthOpen] = useState(deepLinks.isGateOpen("auth"));
  const [waiting, setWaiting] = useState(deepLinks.pending().length);

  useEffect(
    () =>
      handledBus.on("handled", (entry) =>
        setHandled((previous) => [entry, ...previous].slice(0, 5)),
      ),
    [],
  );

  // The pipeline's own bus, not the demo's: a link the OS delivers while
  // this section is on screen is queued without anything here being called,
  // so the count would otherwise sit at a stale zero.
  useEffect(() => {
    const refresh = () => setWaiting(deepLinks.pending().length);

    const unsubscribe = [
      deepLinkEvents.on("deferred", refresh),
      deepLinkEvents.on("handled", refresh),
    ];

    return () => unsubscribe.forEach((stop) => stop());
  }, []);

  const toggleAuth = () => {
    const next = !authOpen;
    // Opening a gate dispatches everything that was only waiting on it, so
    // a link sent while this was off arrives the moment it goes on.
    deepLinks.setGate("auth", next);
    setAuthOpen(next);
  };

  return (
    <View style={styles.container}>
      <Text
        value="Every link runs through one registry, whoever raised it — the OS at launch, the OS while running, or deepLinks.open() from a push notification or toast."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <Input
        value={url}
        onChange={setUrl}
        label="Link"
        autoCapitalize="none"
        helperText="A custom-scheme URL, a universal link, or a bare path"
      />
      <Button
        value="open"
        type="primary"
        onPress={() => void deepLinks.open(url)}
      />

      <View style={styles.actions}>
        {EXAMPLES.map((example) => (
          <Button
            key={example}
            value={example.replace(
              `${env.appScheme}://showcase/deep-links`,
              "…",
            )}
            size="small"
            selected={example === url}
            onPress={() => setUrl(example)}
          />
        ))}
      </View>

      <Readout label="patterns" value={deepLinks.patterns().join("\n")} />
      <Readout label="auth gate" value={authOpen ? "open" : "closed"} />
      <Readout label="waiting on a gate" value={String(waiting)} />
      <Button
        value={authOpen ? "close the auth gate" : "open the auth gate"}
        onPress={toggleAuth}
      />

      <Text value="Handled" type="headline" />
      <Text
        value={handled.length > 0 ? handled.join("\n") : "nothing yet"}
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x12,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.x8,
  },
}));
