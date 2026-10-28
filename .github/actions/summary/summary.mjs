/**
 * Renders one block of the job summary in the shape every workflow shares:
 * a heading with the status, a two-column table of fields, then notes.
 *
 *   ### ⏳ iOS build · preview
 *
 *   | | |
 *   | --- | --- |
 *   | Status | Queued |
 *   | Build | [3f2…](https://expo.dev/builds/3f2…) |
 *
 *   > Queued on EAS; …
 *
 * Used by the `summary` action (action.yml beside it), which passes its
 * inputs as env (TITLE, STATUS, FIELDS, NOTES). FIELDS is one `Label: value`
 * per line, NOTES one note per line; values may carry Markdown. Writes to
 * $GITHUB_STEP_SUMMARY, or stdout locally:
 *
 *   TITLE="iOS build" STATUS=queued FIELDS="Platform: iOS" \
 *     node .github/actions/summary/summary.mjs
 */
import { appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Build states (EAS's words) and GitHub's job.status values, in one set.
export const STATUSES = {
  queued: "⏳ Queued",
  "in-progress": "⏳ In progress",
  finished: "✅ Finished",
  success: "✅ Succeeded",
  failed: "❌ Failed",
  failure: "❌ Failed",
  cancelled: "⚪ Cancelled",
  canceled: "⚪ Cancelled",
  skipped: "⚪ Skipped",
};

const lines = (text) =>
  (text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

// A `|` would end the table cell early.
const cell = (text) => text.replaceAll("|", "\\|");

export function parseFields(text) {
  return lines(text).map((line) => {
    const at = line.indexOf(": ");
    if (at < 1) throw new Error(`Field "${line}" is not "Label: value"`);
    return [line.slice(0, at).trim(), line.slice(at + 2).trim()];
  });
}

export function renderSummary({ title, status, fields = "", notes = "" }) {
  if (!title?.trim()) throw new Error("A summary needs a title");
  const state = status?.trim().toLowerCase();
  const label = state ? (STATUSES[state] ?? state) : "";
  const icon = label.match(/^\S+(?= )/u)?.[0];
  const rows = [
    ...(label ? [["Status", label.replace(/^\S+ /u, "")]] : []),
    ...parseFields(fields),
  ];
  return [
    `### ${icon ? `${icon} ` : ""}${title.trim()}`,
    "",
    ...(rows.length
      ? [
          "| | |",
          "| --- | --- |",
          ...rows.map(([key, value]) => `| ${cell(key)} | ${cell(value)} |`),
          "",
        ]
      : []),
    ...lines(notes).map((note) => `> ${note}\n`),
  ].join("\n");
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const markdown = renderSummary({
    title: process.env.TITLE,
    status: process.env.STATUS,
    fields: process.env.FIELDS,
    notes: process.env.NOTES,
  });
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
  } else {
    console.log(markdown);
  }
}
