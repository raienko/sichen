/**
 * A barrel and nothing else. `withIconDefaults` needs `Icon` itself to
 * recognise its children, so with the component defined here the two would
 * import each other — a require cycle Metro allows but warns can leave a
 * value uninitialised.
 */
export { default } from "./icon";
export { default as withIconDefaults } from "./with-icon-defaults";
// The glyph-name types, so a component that stores an icon name as *data*
// (Toast's per-type config, say) can type that field without reaching
// into this folder's internals.
export type { IconNameByType, IconSetType } from "./icon-sets";
