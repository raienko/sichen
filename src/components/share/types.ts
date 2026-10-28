/**
 * What to hand to the OS share sheet. At least one of `message` or `url`,
 * because a sheet with neither has nothing to pass on — enforced as a union
 * rather than left to a runtime check, since react-native's own `Share`
 * throws an invariant for it and a `tsc` error is a better place to find
 * out.
 *
 * Written as two whole shapes rather than `{ title? } & (A | B)`: the
 * intersection describes the same values but stops narrowing, so a check on
 * `message` no longer tells the compiler which branch it is in — which is
 * exactly what handing this to react-native's own union needs.
 */
export type ShareContent = { title?: string } & (
  { message: string; url?: string } | { message?: string; url: string }
);

/**
 * How a share attempt ended. Four outcomes rather than a boolean, because
 * the three that are not "shared" mean different things to a caller:
 *
 * - `shared` — it went somewhere. On iOS this is what the sheet reports;
 *   Android cannot tell, and reports this for any dismissal too.
 * - `dismissed` — the user closed the sheet without picking anything. Not
 *   an error, and not something to apologise for.
 * - `copied` — there was no share sheet here, so the content went to the
 *   clipboard instead. The user still got what they came for.
 * - `failed` — nothing happened and nothing was copied.
 */
export type ShareOutcome = "shared" | "dismissed" | "copied" | "failed";
