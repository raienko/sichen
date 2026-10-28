import { Text as RNText } from "react-native";

import { render, screen } from "@/root/testing";

import Component from "./index";

/**
 * The harness renders inside the app's providers, so a tree that shows
 * nothing is not an empty tree — it is the providers on their own. This is
 * what "rendered nothing" has to be compared against.
 */
async function nothing() {
  const view = await render(<Component value="none">{null}</Component>);
  return view.toJSON();
}

type Status = "loading" | "error" | "idle" | "ready";

async function match(value: Status, admin = false) {
  return render(
    <Component value={value}>
      <Component.Case when="loading">
        <RNText>spinner</RNText>
      </Component.Case>
      <Component.Case when={["idle", "ready"]}>
        <RNText>results</RNText>
      </Component.Case>
      {admin && (
        <Component.Case when="error">
          <RNText>stack trace</RNText>
        </Component.Case>
      )}
      <Component.Default>
        <RNText>fallback</RNText>
      </Component.Default>
    </Component>,
  );
}

describe(`${Component.displayName} smoke test`, () => {
  it("renders the branch whose value matched", async () => {
    await match("loading");

    expect(screen.getByText("spinner")).toBeTruthy();
    expect(screen.queryByText("results")).toBeNull();
    expect(screen.queryByText("fallback")).toBeNull();
  });

  // The `case "a": case "b":` fall-through, without the missing-`break`.
  it("matches any value in an array", async () => {
    await match("ready");

    expect(screen.getByText("results")).toBeTruthy();
  });

  it("falls back to Default when nothing matched", async () => {
    await match("error");

    expect(screen.getByText("fallback")).toBeTruthy();
  });

  // `{isAdmin && <Case …>}` leaves a `false` among the children.
  it("ignores a branch that was conditioned out, and uses one that wasn't", async () => {
    await match("error", true);

    expect(screen.getByText("stack trace")).toBeTruthy();
    expect(screen.queryByText("fallback")).toBeNull();
  });

  it("renders nothing when nothing matched and there is no Default", async () => {
    const view = await render(
      <Component value="error">
        <Component.Case when="loading">
          <RNText>spinner</RNText>
        </Component.Case>
      </Component>,
    );

    expect(view.queryByText("spinner")).toBeNull();
    expect(view.toJSON()).toEqual(await nothing());
  });

  /**
   * A `Default` above the `Case` that matches still has to lose to it —
   * which is why it is remembered rather than returned on sight.
   */
  it("prefers a match to a Default written before it", async () => {
    await render(
      <Component value="loading">
        <Component.Default>
          <RNText>fallback</RNText>
        </Component.Default>
        <Component.Case when="loading">
          <RNText>spinner</RNText>
        </Component.Case>
      </Component>,
    );

    expect(screen.getByText("spinner")).toBeTruthy();
    expect(screen.queryByText("fallback")).toBeNull();
  });

  it("renders only the first of two matching cases", async () => {
    await render(
      <Component value="loading">
        <Component.Case when="loading">
          <RNText>first</RNText>
        </Component.Case>
        <Component.Case when="loading">
          <RNText>second</RNText>
        </Component.Case>
      </Component>,
    );

    expect(screen.getByText("first")).toBeTruthy();
    expect(screen.queryByText("second")).toBeNull();
  });

  it("adds no host element of its own around the branch", async () => {
    const wrapped = await render(
      <Component value="loading">
        <Component.Case when="loading">
          <RNText>spinner</RNText>
        </Component.Case>
      </Component>,
    );
    const bare = await render(<RNText>spinner</RNText>);

    expect(wrapped.toJSON()).toEqual(bare.toJSON());
  });

  // Object.is, so the identity comparison a `switch` makes — not `==`.
  it("compares by identity", async () => {
    const a = { id: 1 };
    const b = { id: 1 };
    await render(
      <Component value={a}>
        <Component.Case when={b}>
          <RNText>equal shape</RNText>
        </Component.Case>
        <Component.Case when={a}>
          <RNText>same object</RNText>
        </Component.Case>
      </Component>,
    );

    expect(screen.getByText("same object")).toBeTruthy();
    expect(screen.queryByText("equal shape")).toBeNull();
  });

  /**
   * Cases are read as props rather than rendered, so one behind a fragment
   * is invisible to the `Match` — worth pinning down, because the failure
   * is silent and the documentation promises exactly this.
   */
  it("does not see a Case nested inside a fragment", async () => {
    const view = await render(
      <Component value="loading">
        <>
          <Component.Case when="loading">
            <RNText>spinner</RNText>
          </Component.Case>
        </>
      </Component>,
    );

    expect(view.queryByText("spinner")).toBeNull();
    expect(view.toJSON()).toEqual(await nothing());
  });

  it("works over booleans and numbers, not just strings", async () => {
    await render(
      <Component value={2}>
        <Component.Case when={1}>
          <RNText>one</RNText>
        </Component.Case>
        <Component.Case when={2}>
          <RNText>two</RNText>
        </Component.Case>
      </Component>,
    );

    expect(screen.getByText("two")).toBeTruthy();
  });
});
