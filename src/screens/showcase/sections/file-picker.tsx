import { useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import Card from "@/components/card";
import FilePicker, { type FilePickerAsset } from "@/components/file-picker";
import Icon from "@/components/icon";
import Input from "@/components/input";
import Text from "@/components/text";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

const PICKER_ID = "showcase-file-picker";

function describeFile(file?: FilePickerAsset | null) {
  if (!file) return "none";
  const size = file.size === undefined ? "" : ` · ${file.size} bytes`;
  return `${file.name}${size}`;
}

/** The component with a trigger of its own, and the field built on it. */
export default function FilePickerSection() {
  const theme = useTheme();
  const { spacing } = useSizes();
  const styles = useStyles();
  const [dropped, setDropped] = useState<FilePickerAsset>();
  const [attachment, setAttachment] = useState<FilePickerAsset | null>(null);

  return (
    <View style={styles.container}>
      <Text
        value="Opens the system file browser straight from the press — there's no camera to offer and no permission to ask for, so unlike ImagePicker there's no chooser sheet in between."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <FilePicker
        id={PICKER_ID}
        accessibilityLabel="Choose a file"
        onChange={setDropped}
        style={[styles.zone, { borderColor: theme.colors.border }]}
      >
        <Icon
          name="upload"
          size={spacing.x32}
          color={theme.colors.textSecondary}
        />
        <Text value={dropped?.name ?? "Choose a file"} type="callout" />
      </FilePicker>

      <Button
        value="Open with FilePicker.open"
        onPress={() => FilePicker.open(PICKER_ID)}
      />
      <Readout label="file" value={describeFile(dropped)} />
      <Readout label="type" value={dropped?.mimeType ?? "—"} />

      <Text value={'Input type="file"'} type="headline" />
      <Text
        value="The same picker behind a labelled field. It shows the file's own name, never its uri — that's a cache path on native and a blob URL on web, and means nothing to whoever reads it."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
      <Card>
        <Input
          type="file"
          label="Attachment"
          placeholder="Choose a file"
          helperText="Any file type"
          value={attachment}
          onChange={setAttachment}
        />
        <Input
          type="file"
          label="Signed contract"
          placeholder="Choose a PDF"
          helperText="PDF only"
          options={{ type: "application/pdf" }}
          value={null}
          onChange={() => {}}
        />
      </Card>
      <Readout label="attachment" value={describeFile(attachment)} />
    </View>
  );
}

const useStyles = createStyles(({ spacing, units, radius }) => ({
  container: {
    gap: spacing.x8,
  },
  zone: {
    borderRadius: radius.surface,
    alignSelf: "stretch",
    minHeight: units(120),
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.x8,
    borderWidth: spacing.x1,
    borderStyle: "dashed",
  },
}));
