import {
  render as rtlRender,
  renderHook as rtlRenderHook,
  type RenderHookOptions,
  type RenderOptions,
} from "@testing-library/react-native";
import type { ReactElement } from "react";

import Providers from "./providers";

/**
 * Drop-in replacements for @testing-library/react-native's render/renderHook,
 * wrapping every rendered tree in the same Providers used by the real app
 * (and by Storybook's preview.tsx). Import render/renderHook/screen/etc.
 * from here instead of @testing-library/react-native directly, so a new
 * provider added to providers.tsx doesn't require touching every test file
 * that renders a component (or calls a hook) depending on it.
 */
export function render(ui: ReactElement, options?: RenderOptions) {
  return rtlRender(ui, { wrapper: Providers, ...options });
}

export function renderHook<Result, Props>(
  callback: (props: Props) => Result,
  options?: RenderHookOptions<Props>,
) {
  return rtlRenderHook(callback, { wrapper: Providers, ...options });
}

export * from "@testing-library/react-native";

// Ids in tests come from the same helper the components use, so a change
// to the format never touches a test.
export { ANY, testIdPattern } from "@/utils/test-id";
export { testId } from "@/utils";
