import env from "@/constants/env";
import { render, screen, within } from "@/root/testing";

import Component from "./index";

const SECTION_TITLES = [
  "Typography",
  "Markdown",
  "Web view",
  "Theme & colors",
  "Localization",
  "Accessibility",
  "Responsive units",
  "Grid",
  "Spacer",
  "Divider",
  "Icons",
  "Buttons",
  "Tags",
  "Badges",
  "Avatars",
  "Header",
  "Tab bar",
  "Checkboxes",
  "Radio buttons",
  "Switches",
  "Sliders",
  "Stepper",
  "Skeleton",
  "Chart",
  "Map",
  "Barcode",
  "Timer",
  "Progress",
  "Segmented control",
  "Color picker",
  "API",
  "State views",
  "Inputs",
  "Form field",
  "Images",
  "Image viewer",
  "Chat",
  "Cards",
  "Section",
  "List items",
  "List",
  "Carousel",
  "Pagination",
  "Media player",
  "Image picker",
  "File picker",
  "Modals",
  "Popups",
  "Share",
  "Toasts",
  "Alerts",
  "Permissions",
  "Deep links",
  "Storage",
  "Logger",
  "Utilities",
  "Forms",
  "Formatting",
  "Network",
  "Haptics",
];

describe(`${Component.name} smoke test`, () => {
  it("renders the app name as the screen's top-level heading", async () => {
    await render(<Component />);

    // Queried as "heading", not "header": Text sets both spellings, and RN
    // resolves the W3C `role` ahead of `accessibilityRole`, so that's the
    // one that surfaces. Both reach their platform — see headingA11yProps.
    const heading = screen.getByRole("heading");

    expect(heading.props.children).toBe(env.appName);
    expect(heading.props["aria-level"]).toBe(1);
  });

  /**
   * The showcase's whole job is that every section is reachable, so this
   * asserts the full set rather than a sample — a section wired up with a
   * translation key that doesn't resolve fails here rather than being
   * noticed by eye later.
   */
  it("renders every showcase section's title", async () => {
    await render(<Component />);

    for (const title of SECTION_TITLES) {
      expect(screen.getByText(title)).toBeTruthy();
    }
  });

  it("lists the sections alphabetically", async () => {
    await render(<Component />);

    const shown = screen
      .getAllByRole("button", { expanded: false })
      .map((header) =>
        SECTION_TITLES.find((title) => within(header).queryByText(title)),
      )
      .filter((title) => title !== undefined);
    const collator = new Intl.Collator("en");
    expect(shown).toEqual([...shown].sort(collator.compare));
    expect(shown).toHaveLength(SECTION_TITLES.length);
  });

  it("gives every section a collapsed, expandable header", async () => {
    await render(<Component />);

    expect(screen.getAllByRole("button", { expanded: false })).toHaveLength(
      SECTION_TITLES.length,
    );
  });
});
