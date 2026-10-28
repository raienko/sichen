import { useState } from "react";
import { View } from "react-native";

import Card from "@/components/card";
import If from "@/components/if";
import Input from "@/components/input";
import Markdown from "@/components/markdown";
import Switch from "@/components/switch";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

const DOCUMENT = `# Release notes

A paragraph with **bold**, *italic* and \`inline code\`, plus a
[link to the deep-links demo](/showcase/deep-links).

## What changed

- A bullet
- Another bullet
  - A nested one

1. First
2. Second

> A blockquote, for something worth setting apart.

\`\`\`ts
const answer = 42;
\`\`\`

---

### Smaller heading

Every block above is set in a step of the app's own type scale and coloured
from the theme — switch the theme or the text size and this follows.`;

/** A rendered document, and the source behind it. */
export default function MarkdownSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [source, setSource] = useState(DOCUMENT);
  const [editing, setEditing] = useState(false);
  const [tapped, setTapped] = useState("none");

  return (
    <View style={styles.container}>
      <Text
        value="Native markdown rendering, wired to the app's type scale and palette so a paragraph here matches the Text beside it. Its screen-reader announcements come from the app's own catalogue rather than the library's English defaults."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <Switch label="edit the source" value={editing} onChange={setEditing} />

      <If condition={editing}>
        <Input
          type="text"
          label="Markdown"
          helperText="Edit it and the rendering below follows"
          value={source}
          onChange={setSource}
        />
      </If>

      <Card>
        <Markdown
          markdown={source}
          onLinkPress={(event) => setTapped(event.url)}
        />
      </Card>

      <Readout label="last link tapped" value={tapped} />
      <Text
        value="A tapped link normally goes through the deep-link pipeline, so an in-app path opens the same screen a push notification would. This demo intercepts it instead, to show the URL rather than navigate away."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x8,
  },
}));
