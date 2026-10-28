import { useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import StateView, {
  STATE_VIEW_TYPES,
  type StateViewType,
} from "@/components/state-view";
import { createStyles } from "@/features/responsive";
import { wait } from "@/utils";

export default function StateViewsSection() {
  const styles = useStyles();
  const [type, setType] = useState<StateViewType>("empty");

  function showOverlay() {
    const id = StateView.show({
      type,
      title: "Global state overlay",
      message:
        "This blocks the current screen and can be raised from anywhere.",
      actionLabel: "Close overlay",
      onAction: () => StateView.hide(id),
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.types}>
        {STATE_VIEW_TYPES.map((item) => (
          <Button
            key={item}
            value={item}
            size="small"
            selected={item === type}
            onPress={() => setType(item)}
          />
        ))}
      </View>

      <StateView
        type={type}
        message="The same component can live directly inside a screen."
        actionLabel="Test async action"
        onAction={() => wait(750)}
      />

      <Button value="show global overlay" onPress={showOverlay} />
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x12,
  },
  types: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.x8,
  },
}));
