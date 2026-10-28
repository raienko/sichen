import { render } from "@/root/testing";

import Component from "./index";

/**
 * Its own file because the platform is a module-load constant, so it has to
 * be settled before anything imports it. The native behaviour is covered
 * next door.
 */
jest.mock("@/utils", () => ({
  ...jest.requireActual("@/utils"),
  isWeb: true,
}));

const mockReceived: Record<string, unknown>[] = [];

jest.mock("react-native-enriched-markdown", () => ({
  EnrichedMarkdownText: (props: Record<string, unknown>) => {
    const { Text } = jest.requireActual("react-native");
    mockReceived.push(props);
    return <Text testID={props.testID as string}>{props.markdown}</Text>;
  },
}));

describe("Markdown on web", () => {
  // The library's web build is a different component: it destructures the
  // twelve props it understands and spreads the rest onto a `<div>`, so a
  // native-only prop reaches the DOM and React warns about it. That's what
  // `accessibilityLabels` was doing on every render.
  it("drops the native-only props", async () => {
    await render(<Component testID="markdown" markdown="# Title" />);

    expect(mockReceived.at(-1)?.accessibilityLabels).toBeUndefined();
  });

  it("drops one a caller passes too", async () => {
    await render(
      <Component
        testID="markdown"
        markdown="# Title"
        allowFontScaling={false}
      />,
    );

    expect(mockReceived.at(-1)).not.toHaveProperty("allowFontScaling");
  });

  // Only the native-only ones go: everything the web renderer understands
  // has to survive, or the wrapper would be breaking it to silence a warning.
  it("keeps the props the web renderer understands", async () => {
    await render(
      <Component testID="markdown" markdown="# Title" selectable={false} />,
    );

    expect(mockReceived.at(-1)?.selectable).toBe(false);
    expect(mockReceived.at(-1)?.onLinkPress).toBeTruthy();
    expect(mockReceived.at(-1)?.testID).toBe("markdown");
  });

  // The styling is not native-only: it's what makes markdown match the Text
  // beside it, on every platform.
  it("still styles from the app's scale and theme", async () => {
    await render(<Component testID="markdown" markdown="# Title" />);

    expect(mockReceived.at(-1)?.markdownStyle).toBeTruthy();
  });
});
