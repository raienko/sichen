import { Text as RNText } from "react-native";

import type { Env } from "@/constants/env";
import { render, screen } from "@/root/testing";

import withObserve from "./index";

// Spread over the real env rather than replacing it: `projectId` is the
// only field under test, but Providers pulls in modules that read the
// other fields at import time, and a partial mock breaks them.
//
// `requireActual` hands back the env object itself, not a `{ default }`
// wrapper — constants/env/index.js is CommonJS (`module.exports = env`),
// which is also why importing it needs no `.default`.

jest.mock("@/constants/env", () => ({
  __esModule: true,
  default: {
    ...jest.requireActual<Env>("@/constants/env"),
    projectId: undefined,
  },
}));

describe("withObserve", () => {
  it("keeps the component unchanged when projectId is not configured", async () => {
    function Component() {
      return <RNText>content</RNText>;
    }

    const Wrapped = withObserve(Component);

    expect(Wrapped).toBe(Component);
    await render(<Wrapped />);
    expect(screen.getByText("content")).toBeTruthy();
  });
});
