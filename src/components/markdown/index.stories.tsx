import { View } from "react-native";

import Card from "@/components/card";
import { createStyles } from "@/features/responsive";

import Component from "./index";

const meta = {
  title: "components/Markdown",
  component: Component,
};

export default meta;

const DOCUMENT = `# Release notes

A paragraph with **bold**, *italic* and \`inline code\`, plus a
[link to an order](/orders/12).

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

The rest of the document.`;

export const Document = () => <Component markdown={DOCUMENT} />;

/** Every heading level against the app's own type scale. */
export const Headings = () => (
  <Component markdown={"# h1\n## h2\n### h3\n#### h4\n##### h5\n###### h6"} />
);

export const Inline = () => (
  <Component
    markdown={
      "Normal, **bold**, *italic*, ~~struck~~, `code`, and a [link](https://example.com)."
    }
  />
);

export const Lists = () => (
  <Component
    markdown={
      "- One\n- Two\n  - Nested\n\n1. First\n2. Second\n\n- [ ] A task\n- [x] A done task"
    }
  />
);

export const Blockquote = () => (
  <Component
    markdown={"> Set apart from the rest.\n>\n> Over two paragraphs."}
  />
);

export const CodeBlock = () => (
  <Component
    markdown={"```ts\ntype Answer = 42;\nconst answer: Answer = 42;\n```"}
  />
);

/** Inside a Card, which is where a document usually sits. */
export const InACard = () => {
  const styles = useStyles();

  return (
    <View style={styles.stack}>
      <Card>
        <Component
          markdown={"## In a card\n\nAnd it takes the card's padding."}
        />
      </Card>
    </View>
  );
};

const useStyles = createStyles(({ spacing }) => ({
  stack: {
    alignSelf: "stretch",
    gap: spacing.x8,
  },
}));
