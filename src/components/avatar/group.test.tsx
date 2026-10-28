import { render, screen } from "@/root/testing";

import Avatar, { AvatarGroup } from "./index";

const PEOPLE = [
  "Ada Lovelace",
  "Grace Hopper",
  "Alan Turing",
  "Edsger Dijkstra",
].map((name) => ({ name }));

describe(`${AvatarGroup.name} smoke test`, () => {
  it("is one element, named after everyone in it", async () => {
    await render(<AvatarGroup testID="group" people={PEOPLE.slice(0, 2)} />);

    expect(screen.getByTestId("group").props.accessibilityLabel).toBe(
      "Ada Lovelace, Grace Hopper",
    );
  });

  it("collapses the rest into a +N tile that takes the last slot", async () => {
    await render(<AvatarGroup testID="group" people={PEOPLE} max={3} />);

    expect(
      screen.getByText("+2", { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(screen.getByTestId("group").props.accessibilityLabel).toBe(
      "Ada Lovelace, Grace Hopper and 2 more",
    );
  });

  it("draws everyone when they fit exactly", async () => {
    await render(<AvatarGroup people={PEOPLE.slice(0, 3)} max={3} />);

    expect(
      screen.queryByText(/^\+/, { includeHiddenElements: true }),
    ).toBeNull();
  });

  it("is also reachable as Avatar.Group", () => {
    expect(Avatar.Group).toBe(AvatarGroup);
  });
});
