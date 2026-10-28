/**
 * Reads Jest's coverage/coverage-summary.json and hands the Unit tests job's
 * summary its rows as the `fields` step output, rendered by the `summary`
 * action (.github/actions/summary); stdout locally. Reports only — no
 * threshold gate yet; that comes once there's a baseline worth holding.
 */
import { randomUUID } from "node:crypto";
import { appendFileSync, readFileSync } from "node:fs";

const { total } = JSON.parse(
  readFileSync("coverage/coverage-summary.json", "utf8"),
);

const fields = ["lines", "statements", "functions", "branches"]
  .map((metric) => {
    const { covered, total: all, pct } = total[metric];
    return `${metric[0].toUpperCase()}${metric.slice(1)}: ${pct}% · ${covered} / ${all}`;
  })
  .join("\n");

if (process.env.GITHUB_OUTPUT) {
  const delimiter = randomUUID();
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `fields<<${delimiter}\n${fields}\n${delimiter}\n`,
  );
} else {
  console.log(fields);
}
