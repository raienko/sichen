import { Text as RNText } from "react-native";

import { render, screen } from "@/root/testing";

import Component from "./index";

describe(`${Component.name} smoke test`, () => {
  it("renders children when condition is true", async () => {
    await render(
      <Component condition={true}>
        <RNText>content</RNText>
      </Component>,
    );

    expect(screen.getByText("content")).toBeTruthy();
  });

  it("renders nothing when condition is false", async () => {
    await render(
      <Component condition={false}>
        <RNText>content</RNText>
      </Component>,
    );

    expect(screen.queryByText("content")).toBeNull();
  });

  it("adds no host element of its own around the child", async () => {
    const withIf = await render(
      <Component condition={true}>
        <RNText>content</RNText>
      </Component>,
    );
    const bare = await render(<RNText>content</RNText>);

    expect(withIf.toJSON()).toEqual(bare.toJSON());
  });

  it("takes any value and renders on truthiness", async () => {
    const footer: React.ReactNode = <RNText>footer</RNText>;
    await render(<Component condition={footer}>{footer}</Component>);
    expect(screen.getByText("footer")).toBeTruthy();

    await render(
      <Component condition={undefined}>
        <RNText>missing</RNText>
      </Component>,
    );
    expect(screen.queryByText("missing")).toBeNull();
  });
});
