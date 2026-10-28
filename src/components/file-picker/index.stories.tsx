import { useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import Card from "@/components/card";
import Icon from "@/components/icon";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Component, { type FilePickerAsset } from "./index";

const meta = {
  title: "components/FilePicker",
  component: Component,
};

export default meta;

function Chosen({ file }: { file?: FilePickerAsset }) {
  const theme = useTheme();

  return (
    <Text
      value={file ? `${file.name} · ${file.size ?? 0} bytes` : "nothing chosen"}
      type="footnote"
      style={{ color: theme.colors.textSecondary }}
    />
  );
}

/** Anything can be the trigger — here, a dashed drop zone. */
export const DropZone = () => {
  const theme = useTheme();
  const styles = useStyles();
  const [file, setFile] = useState<FilePickerAsset>();

  return (
    <View style={styles.stack}>
      <Component
        id="story-drop-zone"
        accessibilityLabel="Choose a file"
        onChange={setFile}
        style={[styles.zone, { borderColor: theme.colors.border }]}
      >
        <Icon name="upload" color={theme.colors.textSecondary} />
        <Text value="Choose a file" type="callout" />
      </Component>
      <Chosen file={file} />
    </View>
  );
};

/** A row, for a settings-style attachment. */
export const AsARow = () => {
  const styles = useStyles();
  const [file, setFile] = useState<FilePickerAsset>();

  return (
    <Card padded={false}>
      <Component
        id="story-row"
        accessibilityLabel="Attach a document"
        onChange={setFile}
        style={styles.row}
      >
        <Icon name="paperclip" />
        <Text value={file?.name ?? "Attach a document"} />
      </Component>
    </Card>
  );
};

/** Only PDFs on offer. */
export const RestrictedToPdf = () => {
  const styles = useStyles();
  const [file, setFile] = useState<FilePickerAsset>();

  return (
    <View style={styles.stack}>
      <Component
        id="story-pdf"
        accessibilityLabel="Choose a PDF"
        options={{ type: "application/pdf" }}
        onChange={setFile}
      >
        <Text value="Choose a PDF" type="callout" />
      </Component>
      <Chosen file={file} />
    </View>
  );
};

/**
 * Mounted with no children it renders nothing and only answers to the
 * static — which is how `Input`'s `file` variation drives it.
 */
export const Headless = () => {
  const styles = useStyles();
  const [file, setFile] = useState<FilePickerAsset>();

  return (
    <View style={styles.stack}>
      <Component id="story-headless" onChange={setFile} />
      <Button
        value="FilePicker.open('story-headless')"
        onPress={() => Component.open("story-headless")}
      />
      <Chosen file={file} />
    </View>
  );
};

const useStyles = createStyles(({ isRTL, spacing, units, radius }) => ({
  stack: {
    alignSelf: "stretch",
    gap: spacing.x8,
  },
  zone: {
    borderRadius: radius.surface,
    minHeight: units(120),
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.x8,
    borderWidth: spacing.x1,
    borderStyle: "dashed",
  },
  row: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    gap: spacing.x12,
    padding: spacing.x16,
  },
}));
