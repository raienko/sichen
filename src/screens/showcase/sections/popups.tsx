import { useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import Popup from "@/components/popup";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";

import Readout from "./readout";

export default function PopupsSection() {
  const styles = useStyles();
  const [lastAction, setLastAction] = useState("—");

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <Button value="popup" onPress={() => Popup.show("showcase-popup")} />
        <Button value="alert" onPress={() => Popup.show("showcase-alert")} />
        <Button value="prompt" onPress={() => Popup.show("showcase-prompt")} />
        <Button
          value="custom children"
          onPress={() => Popup.show("showcase-custom")}
        />
      </View>

      <Readout label="last callback" value={lastAction} />

      <Popup
        id="showcase-popup"
        title="Publish changes?"
        message="This demonstrates a two-action confirmation popup."
        onConfirm={() => setLastAction("popup confirmed")}
        onCancel={() => setLastAction("popup cancelled")}
      />

      <Popup
        id="showcase-alert"
        type="alert"
        title="Changes saved"
        message="Alerts expose one OK action."
        onConfirm={() => setLastAction("alert acknowledged")}
      />

      <Popup
        id="showcase-prompt"
        type="prompt"
        title="Name this draft"
        message="The entered value is passed to the confirm callback."
        inputLabel="Draft name"
        placeholder="Quarterly plan"
        onConfirm={(value) => setLastAction(`prompt: ${value || "empty"}`)}
        onCancel={() => setLastAction("prompt cancelled")}
      />

      <Popup
        id="showcase-custom"
        title="Custom content"
        confirmLabel="Looks good"
        onConfirm={() => setLastAction("custom content confirmed")}
      >
        <View style={styles.customContent}>
          <Text value="Any React children can render here." type="headline" />
          <Text value="Forms, illustrations, or domain-specific content all fit." />
        </View>
      </Popup>
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
  customContent: {
    gap: spacing.x4,
  },
}));
