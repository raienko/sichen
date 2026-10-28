import type { Env } from "@/constants/env";

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
    projectId: "configured-project-id",
  },
}));

jest.mock("expo-observe", () => {
  throw new Error(
    "Project ID is required to send observability metrics. Make sure you have configured it correctly in app.json.",
  );
});

describe("withObserve with mismatched native configuration", () => {
  it("keeps the component unchanged when the native module cannot initialize", () => {
    function Component() {
      return null;
    }

    expect(withObserve(Component)).toBe(Component);
  });
});
