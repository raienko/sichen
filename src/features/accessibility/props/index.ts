/**
 * Cross-platform accessibility props, grouped by what they describe. Each
 * helper sets every spelling a platform needs (`accessibilityRole` for
 * native, `role` / `aria-*` for react-native-web), so a component never
 * picks just one and goes silent somewhere else.
 */
export {
  checkboxA11yProps,
  controlA11yProps,
  radioA11yProps,
  radioGroupA11yProps,
  sliderA11yProps,
  switchA11yProps,
  tabA11yProps,
  tabListA11yProps,
} from "./controls";
export { progressA11yProps, statusA11yProps } from "./feedback";
export { fieldA11yProps } from "./field";
export {
  disabledA11yProps,
  headingA11yProps,
  imageA11yProps,
  type HeadingLevel,
} from "./structure";
