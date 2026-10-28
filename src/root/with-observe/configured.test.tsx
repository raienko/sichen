import { Observe, ObserveRoot } from "expo-observe";

import withObserve from "./index";

import type { Env } from "@/constants/env";

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
    projectId: "configured-project-id",
  },
}));

jest.mock("expo-observe", () => ({
  Observe: { configure: jest.fn() },
  ObserveRoot: { wrap: jest.fn((Component) => Component) },
}));

describe("withObserve with a configured project", () => {
  it("configures Observe and wraps the component", () => {
    function Component() {
      return null;
    }

    const Wrapped = withObserve(Component);

    expect(Observe.configure).toHaveBeenCalledWith({
      integrations: { "expo-router": true },
      dispatchInDebug: false,
    });
    expect(ObserveRoot.wrap).toHaveBeenCalledWith(Component);
    expect(Wrapped).toBe(Component);
  });
});
