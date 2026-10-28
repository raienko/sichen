import { useMemo } from "react";

import Accordion from "@/components/accordion";
import Header from "@/components/header";
import Screen from "@/components/screen";
import env from "@/constants/env";
import { useLocale, type TranslationKey } from "@/features/localization";
import { createStyles } from "@/features/responsive";

import AccessibilitySection from "./sections/accessibility";
import AvatarsSection from "./sections/avatars";
import BadgesSection from "./sections/badges";
import ButtonsSection from "./sections/buttons";
import BarcodeSection from "./sections/barcode";
import CardSection from "./sections/card";
import CarouselSection from "./sections/carousel";
import ChartSection from "./sections/chart";
import ChatSection from "./sections/chat";
import MapSection from "./sections/map";
import CheckboxesSection from "./sections/checkboxes";
import DeepLinksSection from "./sections/deep-links";
import DividerSection from "./sections/divider";
import FilePickerSection from "./sections/file-picker";
import FormFieldSection from "./sections/form-field";
import GridSection from "./sections/grid";
import HeaderSection from "./sections/header";
import IconsSection from "./sections/icons";
import ImagePickerSection from "./sections/image-picker";
import ImagesSection from "./sections/images";
import ImageViewerSection from "./sections/image-viewer";
import AlertsSection from "./sections/alerts";
import InputsSection from "./sections/inputs";
import ListItemSection from "./sections/list-item";
import ListSection from "./sections/list";
import LocalizationSection from "./sections/localization";
import LoggerSection from "./sections/logger";
import MarkdownSection from "./sections/markdown";
import MediaPlayerSection from "./sections/media-player";
import ModalsSection from "./sections/modals";
import PaginationSection from "./sections/pagination";
import PermissionsSection from "./sections/permissions";
import PopupsSection from "./sections/popups";
import ProgressBarSection from "./sections/progress-bar";
import RadioButtonsSection from "./sections/radio-buttons";
import ResponsiveSection from "./sections/responsive";
import StepperSection from "./sections/stepper";
import StorageSection from "./sections/storage";
import StateViewsSection from "./sections/state-views";
import SectionSection from "./sections/section";
import ApiSection from "./sections/api";
import ColorPickerSection from "./sections/color-picker";
import SegmentedControlSection from "./sections/segmented-control";
import ShareSection from "./sections/share";
import SkeletonSection from "./sections/skeleton";
import SlidersSection from "./sections/sliders";
import SpacerSection from "./sections/spacer";
import SwitchesSection from "./sections/switches";
import TabBarSection from "./sections/tab-bar";
import TagsSection from "./sections/tags";
import ThemeSection from "./sections/theme";
import TimerSection from "./sections/timer";
import ToastsSection from "./sections/toasts";
import TypographySection from "./sections/typography";
import UtilitiesSection from "./sections/utilities";
import WebViewSection from "./sections/web-view";
import FormsSection from "./sections/forms";
import FormattingSection from "./sections/formatting";
import NetworkSection from "./sections/network";
import HapticsSection from "./sections/haptics";

/**
 * One entry per feature or component that can be demonstrated on screen.
 * Ordered foundations-first — the styleguides and app-wide settings that
 * everything else is built out of, then the components that consume them.
 *
 * Each section is its own file under ./sections. They're screen-local (the
 * showcase is the only consumer) but split out for the same reason Modal's
 * internals are: one file per concern beats one file that renders eleven.
 */
const SECTIONS: {
  title: TranslationKey;
  Component: () => React.JSX.Element;
}[] = [
  { title: "showcase.typography", Component: TypographySection },
  { title: "showcase.markdown", Component: MarkdownSection },
  { title: "showcase.webView", Component: WebViewSection },
  { title: "showcase.theme", Component: ThemeSection },
  { title: "showcase.localization", Component: LocalizationSection },
  { title: "showcase.accessibility", Component: AccessibilitySection },
  { title: "showcase.responsive", Component: ResponsiveSection },
  { title: "showcase.grid", Component: GridSection },
  { title: "showcase.spacer", Component: SpacerSection },
  { title: "showcase.divider", Component: DividerSection },
  { title: "showcase.icons", Component: IconsSection },
  { title: "showcase.buttons", Component: ButtonsSection },
  { title: "showcase.tags", Component: TagsSection },
  { title: "showcase.badges", Component: BadgesSection },
  { title: "showcase.avatars", Component: AvatarsSection },
  { title: "showcase.header", Component: HeaderSection },
  { title: "showcase.tabBar", Component: TabBarSection },
  { title: "showcase.checkboxes", Component: CheckboxesSection },
  { title: "showcase.radioButtons", Component: RadioButtonsSection },
  { title: "showcase.switches", Component: SwitchesSection },
  { title: "showcase.sliders", Component: SlidersSection },
  { title: "showcase.stepper", Component: StepperSection },
  { title: "showcase.skeleton", Component: SkeletonSection },
  { title: "showcase.chart", Component: ChartSection },
  { title: "showcase.map", Component: MapSection },
  { title: "showcase.barcode", Component: BarcodeSection },
  { title: "showcase.timer", Component: TimerSection },
  { title: "showcase.progress", Component: ProgressBarSection },
  { title: "showcase.segmentedControl", Component: SegmentedControlSection },
  { title: "showcase.colorPicker", Component: ColorPickerSection },
  { title: "showcase.api", Component: ApiSection },
  { title: "showcase.stateViews", Component: StateViewsSection },
  { title: "showcase.inputs", Component: InputsSection },
  { title: "showcase.formField", Component: FormFieldSection },
  { title: "showcase.images", Component: ImagesSection },
  { title: "showcase.imageViewer", Component: ImageViewerSection },
  { title: "showcase.chat", Component: ChatSection },
  { title: "showcase.cards", Component: CardSection },
  { title: "showcase.section", Component: SectionSection },
  { title: "showcase.listItems", Component: ListItemSection },
  { title: "showcase.list", Component: ListSection },
  { title: "showcase.carousel", Component: CarouselSection },
  { title: "showcase.pagination", Component: PaginationSection },
  { title: "showcase.mediaPlayer", Component: MediaPlayerSection },
  { title: "showcase.imagePicker", Component: ImagePickerSection },
  { title: "showcase.filePicker", Component: FilePickerSection },
  { title: "showcase.modals", Component: ModalsSection },
  { title: "showcase.popups", Component: PopupsSection },
  { title: "showcase.share", Component: ShareSection },
  { title: "showcase.toasts", Component: ToastsSection },
  { title: "showcase.alerts", Component: AlertsSection },
  { title: "showcase.permissions", Component: PermissionsSection },
  { title: "showcase.deepLinks", Component: DeepLinksSection },
  { title: "showcase.storage", Component: StorageSection },
  { title: "showcase.logger", Component: LoggerSection },
  { title: "showcase.utilities", Component: UtilitiesSection },
  { title: "showcase.forms", Component: FormsSection },
  { title: "showcase.formatting", Component: FormattingSection },
  { title: "showcase.network", Component: NetworkSection },
  { title: "showcase.haptics", Component: HapticsSection },
];

export default function Showcase() {
  const { t, locale } = useLocale();
  const styles = useStyles();

  // Alphabetical by the title as shown, in the active language and its own
  // collation, so the list reads in order whichever language it's in — a
  // fixed order in English would be scrambled in Ukrainian or Japanese.
  const sections = useMemo(() => {
    const collator = new Intl.Collator(locale);
    return SECTIONS.map((section) => ({
      ...section,
      label: t(section.title),
    })).sort((a, b) => collator.compare(a.label, b.label));
  }, [locale, t]);

  return (
    // The header's title is the screen's top-level heading; Screen pins it
    // and clears the notch above it.
    <Screen
      scrollable
      header={<Header title={env.appName} />}
      style={styles.container}
    >
      {sections.map(({ title, label, Component }) => (
        // The translation key ("showcase.carousel") is the section's id: it
        // stays put whatever language the titles are in.
        <Accordion key={title} title={label} testID={title}>
          <Component />
        </Accordion>
      ))}
    </Screen>
  );
}

const useStyles = createStyles(({ spacing, sizes }) => ({
  container: {
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 0,
  },
}));
