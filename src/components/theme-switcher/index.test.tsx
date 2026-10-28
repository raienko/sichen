import Text from "@/components/text";
import { useTheme } from "@/features/theme";
import { fireEvent, render, screen, waitFor } from "@/root/testing";
import { testId } from "@/utils";

import Component from "./index";

function CurrentPreference() {
  const theme = useTheme();
  return <Text value={`preference: ${theme.preference}`} />;
}

describe(`${Component.name} smoke test`, () => {
  it("renders an option for each preference", async () => {
    await render(<Component />);

    expect(screen.getByText("Light")).toBeTruthy();
    expect(screen.getByText("Dark")).toBeTruthy();
    expect(screen.getByText("System")).toBeTruthy();
  });

  it("announces as a named radio group with the current preference checked", async () => {
    await render(<Component />);

    const { props } = screen.getByTestId(testId("segmented-control"));
    expect(props.role).toBe("radiogroup");
    expect(props.accessibilityLabel).toBe("Appearance");
    expect(
      screen.getByRole("radio", { name: "System", checked: true }),
    ).toBeTruthy();
  });

  it("updates the theme preference on press", async () => {
    await render(
      <>
        <Component />
        <CurrentPreference />
      </>,
    );

    await fireEvent.press(screen.getByText("Dark"));

    await waitFor(() =>
      expect(screen.getByText("preference: dark")).toBeTruthy(),
    );
  });
});
