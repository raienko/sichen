/**
 * The grid system: `Row` divides into columns, `Cell` occupies some of
 * them, `Column` stacks vertically.
 *
 * Three peers rather than one default export, so this folder is a barrel
 * of named exports instead of the usual `index.tsx` component. They ship
 * together because `Cell` reads `Row`'s context — splitting them into
 * sibling folders would mean importing across another component's
 * internals, which the rest of the codebase doesn't do.
 */
export { default as Row } from "./row";
export { default as Cell } from "./cell";
export { default as Column } from "./column";
