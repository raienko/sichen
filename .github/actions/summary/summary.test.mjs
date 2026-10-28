import assert from "node:assert/strict";
import { test } from "node:test";

import { parseFields, renderSummary } from "./summary.mjs";

test("renders the title, status and fields as one table", () => {
  assert.equal(
    renderSummary({
      title: "iOS build · preview",
      status: "queued",
      fields: "Build: [abc](https://expo.dev/builds/abc)\nVersion: 1.0.0 (7)",
    }),
    [
      "### ⏳ iOS build · preview",
      "",
      "| | |",
      "| --- | --- |",
      "| Status | Queued |",
      "| Build | [abc](https://expo.dev/builds/abc) |",
      "| Version | 1.0.0 (7) |",
      "",
    ].join("\n"),
  );
});

test("takes GitHub's job.status values", () => {
  assert.match(renderSummary({ title: "T", status: "failure" }), /^### ❌ T/);
  assert.match(renderSummary({ title: "T", status: "success" }), /Succeeded/);
});

test("shows an unknown status as given, without an icon", () => {
  assert.match(
    renderSummary({ title: "T", status: "on-hold" }),
    /^### T\n\n.*\n.*\n\| Status \| on-hold \|/,
  );
});

test("leaves the table out when there is nothing to put in it", () => {
  assert.equal(
    renderSummary({ title: "Plan", notes: "First note\n\nSecond note" }),
    "### Plan\n\n> First note\n\n> Second note\n",
  );
});

test("splits a field on its first colon, so URLs stay whole", () => {
  assert.deepEqual(parseFields("Link: https://example.com/a: b"), [
    ["Link", "https://example.com/a: b"],
  ]);
});

test("escapes pipes that would break the table", () => {
  assert.match(renderSummary({ title: "T", fields: "A: x | y" }), /x \\\| y/);
});

test("rejects a field without a label, and a missing title", () => {
  assert.throws(() => parseFields("no label here"), /Label: value/);
  assert.throws(() => renderSummary({ title: " " }), /title/);
});
