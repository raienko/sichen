import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

type CaseProps<T> = {
  /**
   * The value this branch answers to. An array matches any of several — the
   * fall-through of `case "a": case "b":` without the missing-`break` trap
   * that spelling is famous for.
   */
  when: T | readonly T[];
  children: ReactNode;
};

/**
 * One branch. It is never rendered itself — `Match` reads its props and
 * returns the children of whichever branch matched — so it has to be a
 * direct child of the `Match` it belongs to.
 *
 * `T` defaults to `unknown`, so `when` takes anything unless a call site
 * asks for more: `<Match.Case<Status> when="loading">` checks the value
 * against that union. See `Match` for why the type on the `Match` itself
 * cannot do that for you.
 */
function Case<T = unknown>(_props: CaseProps<T>): ReactNode {
  return null;
}

/**
 * The branch taken when no `Case` matched. Optional: a `Match` with nothing
 * to show renders nothing, the same as `If` with a false condition.
 * Position doesn't matter — it is only consulted once every `Case` has
 * missed — but last reads the way the statement does.
 */
function Default({ children }: { children: ReactNode }): ReactNode {
  return children;
}

/**
 * Elements only, so `<Match value={x}>text</Match>` — which would render
 * nothing at all — doesn't compile. `false | null | undefined` stay allowed
 * so a branch can be added conditionally: `{isAdmin && <Match.Case …>}`.
 */
type Branch = ReactElement | false | null | undefined;

type Props<T> = {
  /** Compared against each `when` with `Object.is`. */
  value: T;
  children: Branch | Branch[];
};

/**
 * Picks one of several branches by value — `If` for more than two outcomes.
 * The `switch`/`case` statement as JSX.
 *
 * ```tsx
 * import Match from "@/components/match";
 *
 * <Match<Status> value={status}>
 *   <Match.Case when="loading"><Spinner /></Match.Case>
 *   <Match.Case when={["idle", "ready"]}><Results /></Match.Case>
 *   <Match.Default><Empty /></Match.Default>
 * </Match>
 * ```
 *
 * **`Match`, not `Switch`, because `Switch` is already the toggle.** Two
 * components of the same name is a rename at every call site that wants
 * both, and the one that would have to give way is the control people
 * actually see. `Match` is what the pattern is called wherever it isn't a
 * C-family statement.
 *
 * **Only the first match renders, and there is no fall-through.** The
 * statement's `break` is what everyone means and forgets to write; a case
 * listing several values (`when={["idle", "ready"]}`) covers the one use of
 * fall-through anybody wanted.
 *
 * **It adds no host element**, the same as `If`: the matched branch's
 * children are returned directly, so the tree is what the ternary would
 * have produced, with no layout node between parent and child. That is what
 * makes it usable inside `Chart`'s Skia canvas, where a stray `View` is
 * handed to Skia's reconciler and silently renders nothing.
 *
 * **`<Match<T>>` types `value`, and cannot type the branches.** It reads as
 * though it should, so the limitation is worth knowing before relying on
 * it: a parent's type argument can't reach its JSX children. Every JSX
 * expression arrives typed as `React.JSX.Element` — which is
 * `ReactElement<any>` — so a `children` typed as `ReactElement<CaseProps<T>>`
 * accepts any element at all, and the props are never compared. `NoInfer`
 * and a discriminant on `Default` were both tried; neither helps, because
 * nothing is being compared in the first place. Where a typo in `when`
 * genuinely matters, write the type on the branch —
 * `<Match.Case<Status> when="loading">` turns one into "Did you mean
 * 'loading'?" — and where it doesn't, leave it off and `when` takes
 * anything.
 *
 * **Branches have to be direct children.** They're read as props rather
 * than rendered, so a `Match.Case` inside a fragment or lifted into its own
 * component is invisible here: that branch silently never matches.
 *
 * @example <Match value={size}><Match.Case when="small"><Small /></Match.Case><Match.Default><Large /></Match.Default></Match>
 * @example <Match<ChartType> value={type}><Match.Case when="bar"><Bar /></Match.Case><Match.Default><Line /></Match.Default></Match>
 */
function MatchComponent<T>({ value, children }: Props<T>): ReactNode {
  let fallback: ReactNode = null;

  // `Children.toArray` rather than the raw children: it flattens the arrays
  // a `.map` produces and drops the `false` a conditional branch leaves
  // behind, so both spellings reach the same loop.
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;

    if (child.type === Default) {
      // Kept rather than returned: a `Default` written above the branch
      // that matches still has to lose to it.
      fallback = (child.props as { children: ReactNode }).children;
      continue;
    }

    if (child.type !== Case) continue;

    const { when, children: branch } = child.props as CaseProps<T>;
    const matched = Array.isArray(when)
      ? when.some((option) => Object.is(option, value))
      : Object.is(when, value);

    if (matched) return branch;
  }

  return fallback;
}

/**
 * Hung off `Match` rather than exported beside it, so the three read as one
 * construct at the call site and `Match.Case` can't be imported without the
 * `Match` that gives it meaning — it does nothing on its own. Same shape as
 * `Share.copy` and `Popup.show`.
 */
type MatchStatic = {
  displayName: string;
  Case: typeof Case;
  Default: typeof Default;
};

const Match = MatchComponent as typeof MatchComponent & MatchStatic;

// Set explicitly because the alias erases `.name`, the same reason `Share`
// and `Modal` set one.
Match.displayName = "Match";
Match.Case = Case;
Match.Default = Default;

export default Match;
