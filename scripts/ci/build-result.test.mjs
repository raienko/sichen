import assert from "node:assert/strict";
import { test } from "node:test";

import { describeBuild } from "./build-result.mjs";

const id = "25d0f764-a317-4f71-8fb5-a25d7a66b5e5";
const queued = { id, platform: "IOS", status: "NEW", appVersion: "1.0.0" };

test("a queued build links the build page and says where it goes", () => {
  assert.deepEqual(
    describeBuild([{ ...queued, appBuildVersion: "7" }], {
      platform: "ios",
      waited: false,
      submit: true,
    }),
    {
      state: "queued",
      fields: [
        `Build: [${id}](https://expo.dev/builds/${id})`,
        "Version: 1.0.0 (7)",
        "Submission: TestFlight, once the build succeeds",
      ],
      notes: [
        "Queued on EAS; this job didn't wait. The build page shows its progress.",
        "The submission's status is on the build page.",
      ],
    },
  );
});

test("a waited build reports how it ended, with its artifact", () => {
  const result = describeBuild(
    [
      {
        ...queued,
        platform: "ANDROID",
        status: "FINISHED",
        artifacts: { buildUrl: "https://expo.dev/artifacts/x.aab" },
      },
    ],
    { platform: "android", waited: true, submit: false },
  );
  assert.equal(result.state, "finished");
  assert.ok(
    result.fields.includes(
      "Artifact: [Download](https://expo.dev/artifacts/x.aab)",
    ),
  );
  assert.ok(result.fields.includes("Submission: Off"));
  assert.deepEqual(result.notes, []);

  const options = { platform: "ios", waited: true, submit: false };
  assert.equal(
    describeBuild([{ ...queued, status: "ERRORED" }], options).state,
    "failed",
  );
  assert.equal(
    describeBuild([{ ...queued, status: "CANCELED" }], options).state,
    "cancelled",
  );
});

test("rejects anything but one valid build for the job's platform", () => {
  const options = { platform: "ios", waited: false, submit: false };
  assert.throws(() => describeBuild([], options), /one ios build/);
  assert.throws(
    () => describeBuild([queued, queued], options),
    /one ios build/,
  );
  assert.throws(
    () => describeBuild([{ ...queued, id: "x" }], options),
    /Invalid build ID/,
  );
  assert.throws(
    () => describeBuild([queued], { ...options, platform: "android" }),
    /not android/,
  );
});
