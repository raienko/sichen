import { View } from "react-native";

import Button from "@/components/button";
import Text from "@/components/text";
import logger from "@/features/logger";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

const EXAMPLE_REQUEST = {
  method: "GET",
  url: "/api/profile",
  requestId: "showcase-001",
};

export default function LoggerSection() {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Text
        value="Open React Native DevTools to inspect styled messages and expandable values."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />
      <View style={styles.actions}>
        <Button
          value="log"
          onPress={() =>
            logger.log("General diagnostic", { source: "showcase" })
          }
        />
        <Button
          value="warn"
          onPress={() => logger.warn("A recoverable condition needs attention")}
        />
        <Button
          value="error"
          onPress={() => logger.error("An unexpected application error")}
        />
        <Button
          value="success"
          onPress={() => logger.success("Profile saved", { userId: 42 })}
        />
        <Button
          value="out"
          onPress={() => logger.out("GET /api/profile", EXAMPLE_REQUEST)}
        />
        <Button
          value="in"
          onPress={() =>
            logger.in("200 GET /api/profile", {
              ...EXAMPLE_REQUEST,
              status: 200,
              durationMs: 84,
            })
          }
        />
        <Button
          value="failed"
          onPress={() =>
            logger.failed("503 GET /api/profile", {
              ...EXAMPLE_REQUEST,
              status: 503,
            })
          }
        />
      </View>
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x8,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.x8,
  },
}));
