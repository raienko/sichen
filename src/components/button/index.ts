/**
 * A barrel and nothing else. `IconButton` is a `Button` with an icon in it,
 * so with the component defined here the two would import each other — a
 * require cycle Metro allows but warns can leave a value uninitialised.
 */
export { default } from "./button";
export { default as IconButton } from "./icon-button";
export type { ButtonSize, ButtonType } from "./palette";
export type { IconButtonSize } from "./icon-button";
