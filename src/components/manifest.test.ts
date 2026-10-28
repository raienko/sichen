import { readdirSync, readFileSync, type Dirent } from "node:fs";
import { join } from "node:path";

import { COMPONENTS } from "./manifest.json";

/**
 * The manifest is only useful while it matches the folders, and the
 * definition of done is only useful while something checks it. These are
 * the parts of it a file listing can prove: a guide, a test, and — for the
 * public kit — a story, plus a row in the docs catalogue.
 */
const ROOT = __dirname;
const CATALOGUE = readFileSync(
  join(ROOT, "../../docs/components/index.md"),
  "utf8",
);

const folders = readdirSync(ROOT, { withFileTypes: true })
  .filter((entry: Dirent) => entry.isDirectory())
  .map((entry: Dirent) => entry.name)
  .sort();

/** Every file under a component folder, as a path relative to it. */
function filesOf(name: string): string[] {
  return readdirSync(join(ROOT, name), { recursive: true, encoding: "utf8" });
}

const entries = Object.entries(COMPONENTS) as [string, "public" | "internal"][];

describe("component manifest", () => {
  it("lists every component folder, and nothing else", () => {
    expect(Object.keys(COMPONENTS).sort()).toEqual(folders);
  });

  it("marks each entry public or internal", () => {
    for (const [, role] of entries) {
      expect(["public", "internal"]).toContain(role);
    }
  });

  describe.each(entries)("%s (%s)", (name, role) => {
    const files = filesOf(name);

    it("has a guide next to its code", () => {
      expect(files).toContain("index.md");
    });

    it("has a test", () => {
      expect(files.some((file) => /\.test\.tsx?$/.test(file))).toBe(true);
    });

    it("is linked from the docs catalogue", () => {
      expect(CATALOGUE).toContain(`src/components/${name}/index.md`);
    });

    if (role === "public") {
      it("has a story", () => {
        expect(files.some((file) => /\.stories\.tsx$/.test(file))).toBe(true);
      });
    }
  });
});
