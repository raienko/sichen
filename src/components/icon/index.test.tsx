import { Text as RNText } from "react-native";

import { useTheme } from "@/features/theme";
import { render } from "@/root/testing";

import Component, { withIconDefaults } from "./index";

describe(`${Component.name} smoke test`, () => {
  it("renders a vector icon", async () => {
    const { toJSON } = await render(<Component type="Feather" name="home" />);

    expect(toJSON()).toBeTruthy();
  });

  it("defaults to the default icon type when type is omitted", async () => {
    const withDefault = await render(<Component name="home" />);
    const withExplicitDefault = await render(
      <Component type="Feather" name="home" />,
    );

    expect(JSON.stringify(withDefault.toJSON())).toBe(
      JSON.stringify(withExplicitDefault.toJSON()),
    );
  });

  it("renders a custom icon", async () => {
    const { toJSON } = await render(<Component type="custom" name="logo" />);

    expect(toJSON()).toBeTruthy();
  });

  it("passes size and color through to a vector icon", async () => {
    const { toJSON } = await render(
      <Component type="Feather" name="home" size={32} color="red" />,
    );

    expect(JSON.stringify(toJSON())).toContain("red");
  });

  it("defaults color to theme.colors.text when color is omitted", async () => {
    let themeColor: string | undefined;
    function ThemeColorReader() {
      themeColor = useTheme().colors.text;
      return null;
    }

    const withDefault = await render(
      <>
        <Component type="Feather" name="home" />
        <ThemeColorReader />
      </>,
    );

    expect(themeColor).toBeTruthy();
    expect(JSON.stringify(withDefault.toJSON())).toContain(
      themeColor as string,
    );
  });

  it("lets an explicit color override the theme default", async () => {
    let themeColor: string | undefined;
    function ThemeColorReader() {
      themeColor = useTheme().colors.text;
      return null;
    }

    const withOverride = await render(
      <>
        <Component type="Feather" name="home" color="blue" />
        <ThemeColorReader />
      </>,
    );

    expect(themeColor).toBeTruthy();
    expect(JSON.stringify(withOverride.toJSON())).not.toContain(
      themeColor as string,
    );
    expect(JSON.stringify(withOverride.toJSON())).toContain("blue");
  });
});

/**
 * What lets `Button` colour and size an icon child without the call site
 * restating either — see the resolution rules on `withIconDefaults`.
 */
describe("withIconDefaults", () => {
  it("supplies a colour to an icon that has none of its own", async () => {
    const { toJSON } = await render(
      <>
        {withIconDefaults(<Component name="home" />, {
          color: "rebeccapurple",
        })}
      </>,
    );

    expect(JSON.stringify(toJSON())).toContain("rebeccapurple");
  });

  it("supplies a size the same way", async () => {
    const { toJSON } = await render(
      <>{withIconDefaults(<Component name="home" />, { size: 37 })}</>,
    );

    expect(JSON.stringify(toJSON())).toContain("37");
  });

  // A default, not an override: a call site that has a reason to differ
  // still wins, which is how the password field keeps its muted eye.
  it("loses to the icon's own props", async () => {
    const { toJSON } = await render(
      <>
        {withIconDefaults(<Component name="home" color="red" size={11} />, {
          color: "rebeccapurple",
          size: 37,
        })}
      </>,
    );
    const tree = JSON.stringify(toJSON());

    expect(tree).toContain("red");
    expect(tree).not.toContain("rebeccapurple");
    expect(tree).toContain("11");
  });

  it("fills in every icon in a list of children", async () => {
    const { toJSON } = await render(
      <>
        {withIconDefaults(
          [
            <Component key="a" name="home" />,
            <Component key="b" name="star" />,
          ],
          { color: "rebeccapurple" },
        )}
      </>,
    );

    expect(JSON.stringify(toJSON()).match(/rebeccapurple/g)).toHaveLength(2);
  });

  /**
   * Anything that isn't an `Icon` is passed through untouched — cloning it
   * would push a `color` prop onto an element with no use for one, and the
   * icon nested inside keeps taking its own props as it always did.
   */
  it("leaves other elements alone", async () => {
    const { toJSON } = await render(
      <>
        {withIconDefaults(<RNText>plain</RNText>, {
          color: "rebeccapurple",
        })}
      </>,
    );
    const tree = JSON.stringify(toJSON());

    expect(tree).toContain("plain");
    expect(tree).not.toContain("rebeccapurple");
  });
});
