/**
 * Reads OSV-Scanner's JSON report and fails on anything high or critical
 * (CVSS 7.0+) that isn't in the exception register (osv-scanner.toml, which
 * the scanner applies itself). Medium and low are listed but don't fail:
 * they're fixed on the severity policy's schedule, not by blocking a build.
 *
 *   osv-scanner scan source --lockfile yarn.lock --config osv-scanner.toml \
 *     --format json --output osv.json
 *   node scripts/security/vulnerabilities.mjs osv.json
 */
import { readFileSync } from "node:fs";

const HIGH = 7;

const report = JSON.parse(readFileSync(process.argv[2], "utf8"));

const findings = (report.results ?? []).flatMap((result) =>
  (result.packages ?? []).flatMap(({ package: pkg, groups = [] }) =>
    groups.map((group) => ({
      name: `${pkg.name}@${pkg.version}`,
      ids: group.ids.join(", "),
      severity: Number.parseFloat(group.max_severity),
    })),
  ),
);

const level = ({ severity }) =>
  Number.isNaN(severity)
    ? "unrated"
    : severity >= 9
      ? "critical"
      : severity >= HIGH
        ? "high"
        : severity >= 4
          ? "medium"
          : "low";

for (const finding of findings) {
  console.log(`${level(finding).padEnd(9)} ${finding.name}  ${finding.ids}`);
}

const blocking = findings.filter(({ severity }) => severity >= HIGH);
if (blocking.length > 0) {
  console.error(
    `\n${blocking.length} high or critical finding(s). Fix the dependency, or add an exception with an owner and expiry to osv-scanner.toml and docs/security/exceptions.md.`,
  );
  process.exit(1);
}
console.log(
  `\n${findings.length} finding(s), none high or critical outside the register.`,
);
