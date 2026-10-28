import { Pressable } from "react-native";

import Text from "@/components/text";
import { LocalValue } from "@/features/storage";
import { fireEvent, render, screen, waitFor } from "@/root/testing";

import { useLocale } from "./hooks";
import LocaleProvider from "./locale-provider";

const mockUseLocales = jest.fn<{ languageCode: string | null }[], []>(() => [
  { languageCode: "es" },
]);

jest.mock("expo-localization", () => ({
  useLocales: () => mockUseLocales(),
}));

function Probe() {
  const { locale, setPreference } = useLocale();
  return (
    <>
      <Text value={`locale:${locale}`} />
      <Pressable testID="pick-ja" onPress={() => setPreference("ja")} />
      <Pressable testID="pick-system" onPress={() => setPreference("system")} />
    </>
  );
}

function TranslationProbe() {
  const { t } = useLocale();
  return <Text value={t("app.home.title")} />;
}

describe("LocaleProvider", () => {
  beforeEach(() => {
    new LocalValue("locale-preference").reset();
    new LocalValue("os-locale").reset();
    mockUseLocales.mockReturnValue([{ languageCode: "es" }]);
  });

  it("uses the device language on a first launch, with nothing stored", async () => {
    await render(<Probe />);

    expect(screen.getByText("locale:es")).toBeTruthy();
  });

  it("falls back to en when the device language isn't one this app ships", async () => {
    mockUseLocales.mockReturnValue([{ languageCode: "fi" }]);
    await render(<Probe />);

    expect(screen.getByText("locale:en")).toBeTruthy();
  });

  it("takes the device's next preferred language when the first isn't supported", async () => {
    mockUseLocales.mockReturnValue([
      { languageCode: "fi" },
      { languageCode: "uk" },
    ]);
    await render(<Probe />);

    expect(screen.getByText("locale:uk")).toBeTruthy();
  });

  it("persists the resolved device language", async () => {
    await render(<Probe />);

    await waitFor(() =>
      expect(new LocalValue<string>("os-locale").getValue()).toBe("es"),
    );
  });

  // The rule this whole change exists for: the OS seeds the initial launch,
  // but a deliberate choice outranks it from then on.
  it("keeps a manual selection even when the OS language changes", async () => {
    await render(<Probe />);
    expect(screen.getByText("locale:es")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("pick-ja"));
    await waitFor(() => expect(screen.getByText("locale:ja")).toBeTruthy());

    mockUseLocales.mockReturnValue([{ languageCode: "uk" }]);
    await render(<Probe />);

    expect(screen.getByText("locale:ja")).toBeTruthy();
  });

  it("follows the OS again once the preference is set back to system", async () => {
    await render(<Probe />);
    await fireEvent.press(screen.getByTestId("pick-ja"));
    await waitFor(() => expect(screen.getByText("locale:ja")).toBeTruthy());

    await fireEvent.press(screen.getByTestId("pick-system"));
    await waitFor(() => expect(screen.getByText("locale:es")).toBeTruthy());
  });

  it("makes app translations from its config available through t", async () => {
    mockUseLocales.mockReturnValue([{ languageCode: "en" }]);

    await render(
      <LocaleProvider
        config={{
          translations: { en: { app: { home: { title: "Configured home" } } } },
        }}
      >
        <TranslationProbe />
      </LocaleProvider>,
    );

    expect(screen.getByText("Configured home")).toBeTruthy();
  });
});
