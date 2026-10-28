import { render, screen } from "@/root/testing";

import Component from "./index";

describe(`${Component.name} smoke test`, () => {
  it("renders as a localized progress indicator", async () => {
    await render(<Component />);

    expect(
      screen.getByRole("progressbar", { name: "Loading" }),
    ).toBeOnTheScreen();
  });

  it("supports a custom label, colour, and responsive size", async () => {
    await render(
      <Component
        testID="spinner"
        label="Uploading"
        color="rebeccapurple"
        size="large"
      />,
    );

    const spinner = screen.getByRole("progressbar", { name: "Uploading" });
    expect(spinner).toHaveProp("color", "rebeccapurple");
    expect(spinner.props.size).toBeGreaterThan(0);
  });

  it("can defer accessibility to a labelled busy parent", async () => {
    await render(<Component testID="spinner" label={null} />);

    expect(screen.getByTestId("spinner")).toBeOnTheScreen();
    expect(screen.queryByRole("progressbar")).not.toBeOnTheScreen();
  });
});
