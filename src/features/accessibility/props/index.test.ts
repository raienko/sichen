import {
  checkboxA11yProps,
  controlA11yProps,
  disabledA11yProps,
  fieldA11yProps,
  radioA11yProps,
  sliderA11yProps,
  statusA11yProps,
  switchA11yProps,
} from "./index";

describe("sliderA11yProps", () => {
  it("exposes adjustable native semantics and an ARIA range", () => {
    const props = sliderA11yProps({
      label: "Minimum price",
      value: 25,
      valueText: "$25",
      min: 0,
      max: 100,
      disabled: false,
    });

    expect(props.accessibilityRole).toBe("adjustable");
    expect(props.role).toBe("slider");
    expect(props.accessibilityLabel).toBe("Minimum price");
    expect(props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      now: 25,
      text: "$25",
    });
    expect(props["aria-valuemin"]).toBe(0);
    expect(props["aria-valuemax"]).toBe(100);
    expect(props["aria-valuenow"]).toBe(25);
    expect(props["aria-valuetext"]).toBe("$25");
  });
});

describe("checkboxA11yProps", () => {
  it("exposes a checkbox's name, checked state, and disabled state", () => {
    const props = checkboxA11yProps({
      label: "Accept terms",
      checked: true,
      disabled: false,
    });

    expect(props.accessibilityRole).toBe("checkbox");
    expect(props.role).toBe("checkbox");
    expect(props.accessibilityLabel).toBe("Accept terms");
    expect(props.accessibilityState).toEqual({
      checked: true,
      disabled: false,
    });
  });

  it("mirrors checkbox state to aria-* for web", () => {
    const props = checkboxA11yProps({
      label: "Accept terms",
      checked: false,
      disabled: true,
    });

    expect(props["aria-checked"]).toBe(false);
    expect(props["aria-disabled"]).toBe(true);
  });
});

describe("switchA11yProps", () => {
  it("exposes the switch role, name, and current state", () => {
    const props = switchA11yProps({
      label: "Notifications",
      value: true,
      disabled: false,
    });

    expect(props.accessibilityRole).toBe("switch");
    expect(props.role).toBe("switch");
    expect(props.accessibilityLabel).toBe("Notifications");
    expect(props.accessibilityState).toEqual({
      checked: true,
      disabled: false,
    });
    expect(props["aria-checked"]).toBe(true);
    expect(props["aria-disabled"]).toBe(false);
  });
});

describe("radioA11yProps", () => {
  it("exposes the radio role, name, checked state, and disabled state", () => {
    const props = radioA11yProps({
      label: "Monthly",
      checked: true,
      disabled: false,
    });

    expect(props.accessibilityRole).toBe("radio");
    expect(props.role).toBe("radio");
    expect(props.accessibilityLabel).toBe("Monthly");
    expect(props.accessibilityState).toEqual({
      checked: true,
      disabled: false,
    });
    expect(props["aria-checked"]).toBe(true);
    expect(props["aria-disabled"]).toBe(false);
  });
});

describe("controlA11yProps", () => {
  it("always marks the element as a button", () => {
    expect(controlA11yProps().accessibilityRole).toBe("button");
  });

  it("omits state entirely when nothing was passed", () => {
    // A plain button reporting `selected: false` would have a screen reader
    // announce a selection state the control doesn't actually have.
    expect(controlA11yProps()).not.toHaveProperty("accessibilityState");
  });

  it("emits only the state keys it was given", () => {
    expect(controlA11yProps({ expanded: false }).accessibilityState).toEqual({
      expanded: false,
    });
    expect(
      controlA11yProps({ disabled: true, selected: false }).accessibilityState,
    ).toEqual({ disabled: true, selected: false });
  });

  // react-native-web 0.21 renders only the aria-* form, so state set solely
  // through accessibilityState reaches native but produces nothing in the
  // DOM. Both spellings have to be present.
  it("mirrors state to aria-* for the web renderer", () => {
    const props = controlA11yProps({ expanded: true, disabled: false });

    expect(props["aria-expanded"]).toBe(true);
    expect(props["aria-disabled"]).toBe(false);
    expect(props).not.toHaveProperty("aria-selected");
  });

  it("omits the label when the element labels itself through its children", () => {
    expect(controlA11yProps()).not.toHaveProperty("accessibilityLabel");
    expect(controlA11yProps({ label: "Dismiss" }).accessibilityLabel).toBe(
      "Dismiss",
    );
  });

  // A select announces "Country, United Kingdom" — the setting is separate
  // from the label so a changed value doesn't re-announce the whole string.
  it("carries a current value separately from the label, in both spellings", () => {
    expect(controlA11yProps()).not.toHaveProperty("accessibilityValue");

    const props = controlA11yProps({
      label: "Country",
      value: "United Kingdom",
    });

    expect(props.accessibilityLabel).toBe("Country");
    expect(props.accessibilityValue).toEqual({ text: "United Kingdom" });
    expect(props["aria-valuetext"]).toBe("United Kingdom");
  });

  it("surfaces a hint only when given one", () => {
    expect(controlA11yProps()).not.toHaveProperty("accessibilityHint");
    expect(controlA11yProps({ hint: "Required" }).accessibilityHint).toBe(
      "Required",
    );
  });
});

describe("fieldA11yProps", () => {
  it("labels the field and always reports disabled state", () => {
    const props = fieldA11yProps({ label: "Email", disabled: false });

    expect(props.accessibilityLabel).toBe("Email");
    expect(props.accessibilityState).toEqual({ disabled: false });
  });

  // RN has no "invalid" accessibility state, so the message rides along as
  // a hint — otherwise the red border is the only signal there is.
  it("surfaces an error as the field's hint", () => {
    const props = fieldA11yProps({
      label: "Email",
      error: "Enter a valid email",
    });

    expect(props.accessibilityHint).toBe("Enter a valid email");
  });

  it("has no hint when there is no error", () => {
    expect(fieldA11yProps({ label: "Email" })).not.toHaveProperty(
      "accessibilityHint",
    );
  });
});

describe("statusA11yProps", () => {
  it("announces politely by default", () => {
    const props = statusA11yProps();

    expect(props.accessibilityLiveRegion).toBe("polite");
    expect(props["aria-live"]).toBe("polite");
    expect(props.role).toBe("status");
  });

  // Interrupting is exactly as rude as it sounds, so only something the
  // user has to act on now should ask for it.
  it("interrupts only when asked to", () => {
    const props = statusA11yProps({ urgency: "assertive" });

    expect(props.accessibilityLiveRegion).toBe("assertive");
    expect(props["aria-live"]).toBe("assertive");
    expect(props.role).toBe("alert");
  });

  it("omits the label when the region's own text is the whole message", () => {
    expect(statusA11yProps()).not.toHaveProperty("accessibilityLabel");
    expect(statusA11yProps({ label: "Error, Could not save" })).toHaveProperty(
      "accessibilityLabel",
      "Error, Could not save",
    );
  });
});

describe("disabledA11yProps", () => {
  // One spelling per platform, so a purely visual node isn't a stop a
  // screen-reader user has to swipe past on whichever one was left out.
  it("hides the node on every platform at once", () => {
    const props = disabledA11yProps();

    expect(props.accessible).toBe(false);
    expect(props.accessibilityElementsHidden).toBe(true);
    expect(props.importantForAccessibility).toBe("no-hide-descendants");
    expect(props["aria-hidden"]).toBe(true);
  });

  it("says nothing — no role, name, or state to announce", () => {
    const props = disabledA11yProps();

    expect(props).not.toHaveProperty("accessibilityRole");
    expect(props).not.toHaveProperty("role");
    expect(props).not.toHaveProperty("accessibilityLabel");
    expect(props).not.toHaveProperty("accessibilityState");
  });
});
