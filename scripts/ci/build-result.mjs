/**
 * Reads what `eas build --json` printed for one platform and hands the
 * App build job's summary its values: `state`, `fields` and `notes` as step
 * outputs, rendered by the `summary` action (.github/actions/summary).
 * Fails when the job waited and the build didn't finish — after writing the
 * outputs, so the summary still links the build.
 *
 *   PLATFORM=ios WAIT=false SUBMIT=true \
 *     node scripts/ci/build-result.mjs /tmp/eas-build.json
 */
import { randomUUID } from "node:crypto";
import { appendFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Where --auto-submit sends each platform (eas.json's submit profiles).
const DESTINATION = {
  ios: "TestFlight",
  android: "Google Play internal testing (draft)",
};

export function describeBuild(builds, { platform, waited, submit }) {
  if (!Array.isArray(builds) || builds.length !== 1) {
    throw new Error(`Expected one ${platform} build from EAS`);
  }
  const [build] = builds;
  if (!/^[0-9a-f-]{36}$/i.test(build.id)) throw new Error("Invalid build ID");
  if (build.platform?.toLowerCase() !== platform) {
    throw new Error(`EAS returned a ${build.platform} build, not ${platform}`);
  }

  // Without --wait the build is only queued, so there's no result to check.
  const state = !waited
    ? "queued"
    : build.status === "FINISHED"
      ? "finished"
      : build.status === "CANCELED"
        ? "cancelled"
        : "failed";
  const version = [
    build.appVersion,
    build.appBuildVersion && `(${build.appBuildVersion})`,
  ]
    .filter(Boolean)
    .join(" ");
  const fields = [
    `Build: [${build.id}](https://expo.dev/builds/${build.id})`,
    ...(version ? [`Version: ${version}`] : []),
    ...(build.artifacts?.buildUrl
      ? [`Artifact: [Download](${build.artifacts.buildUrl})`]
      : []),
    // EAS submits it (--auto-submit) once the build succeeds, on its side.
    `Submission: ${submit ? `${DESTINATION[platform]}, once the build succeeds` : "Off"}`,
  ];
  const notes = [
    ...(waited
      ? []
      : [
          "Queued on EAS; this job didn't wait. The build page shows its progress.",
        ]),
    ...(submit ? ["The submission's status is on the build page."] : []),
  ];
  return { state, fields, notes };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const { state, fields, notes } = describeBuild(
    JSON.parse(readFileSync(process.argv[2], "utf8")),
    {
      platform: process.env.PLATFORM,
      waited: process.env.WAIT === "true",
      submit: process.env.SUBMIT === "true",
    },
  );
  const outputs = { state, fields: fields.join("\n"), notes: notes.join("\n") };
  if (process.env.GITHUB_OUTPUT) {
    for (const [key, value] of Object.entries(outputs)) {
      const delimiter = randomUUID();
      appendFileSync(
        process.env.GITHUB_OUTPUT,
        `${key}<<${delimiter}\n${value}\n${delimiter}\n`,
      );
    }
  } else {
    console.log(outputs);
  }
  if (["failed", "cancelled"].includes(state)) {
    console.log(
      `::error title=EAS build::The ${process.env.PLATFORM} build ${state}`,
    );
    process.exit(1);
  }
}
