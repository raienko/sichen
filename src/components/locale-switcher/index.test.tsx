import Text from "@/components/text";
import { useLocale, type LocalePreference } from "@/features/localization";
import { LocalValue } from "@/features/storage";
import { fireEvent, render, screen, waitFor } from "@/root/testing";

import Component from "./index";

// The stored preference outlives a single render (that's the point of it),
// so each test starts from a first-launch "system" rather than inheriting
// whatever the previous one picked.
const storedPreference = new LocalValue<LocalePreference>("locale-preference");

beforeEach(() => {
  storedPreference.reset();
});

function CurrentPreference() {
  const locale = useLocale();
  return <Text value={`preference: ${locale.preference}`} />;
}

/** Presses the field and waits for the options Modal to finish presenting. */
async function openOptions(label = "Language") {
  await fireEvent.press(screen.getByLabelText(label));
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "English" })).toBeTruthy();
  });
}

describe(`${Component.name} smoke test`, () => {
  it("shows the current preference in the collapsed field", async () => {
    await render(<Component />);

    // "system" is the first-launch default, and its label is the only one
    // that's translated rather than shown in its own language.
    expect(screen.getByText("System")).toBeTruthy();
    expect(screen.queryByText("Español")).toBeNull();
  });

  it("lists an option for every locale plus system once opened", async () => {
    await render(<Component />);

    await openOptions();

    expect(screen.getByRole("button", { name: "English" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Українська" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Español" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "中文" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "日本語" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "العربية" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "System" })).toBeTruthy();
  });

  it("updates the locale preference on pick", async () => {
    await render(
      <>
        <Component />
        <CurrentPreference />
      </>,
    );

    await openOptions();
    await fireEvent.press(screen.getByRole("button", { name: "Español" }));

    await waitFor(() =>
      expect(screen.getByText("preference: es")).toBeTruthy(),
    );
    // The switcher re-labels itself in the language just picked, so the
    // field is showing a live `t()` rather than a value captured on mount.
    expect(screen.getByLabelText("Idioma")).toBeTruthy();
  });

  it("marks the current preference as the selected option", async () => {
    storedPreference.setValue("ja");
    await render(<Component />);

    await openOptions("言語");

    expect(
      screen.getByRole("button", { name: "日本語" }).props.accessibilityState,
    ).toEqual({ selected: true });
    expect(
      screen.getByRole("button", { name: "English" }).props.accessibilityState,
    ).toEqual({ selected: false });
  });
});
