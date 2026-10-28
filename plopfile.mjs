/**
 * Generators for the pieces this repo is made of:
 *
 *   yarn new component   → src/components/<name>  (+ manifest, catalogue)
 *   yarn new feature     → src/features/<name>    (+ catalogue)
 *   yarn new screen      → src/screens/<name>
 *   yarn new section     → a showcase section      (+ list, test, 10 locales)
 *
 * Each writes what CI checks for (a guide, a test, a story for public
 * components) and updates the registries, so a new piece passes
 * `yarn verify` before anything has been written in it.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

const COMPONENT_CATALOGUE = "docs/components/index.md";
const FEATURE_CATALOGUE = "docs/features/index.md";
const MANIFEST = "src/components/manifest.json";
const SHOWCASE = "src/screens/showcase/index.tsx";
const SHOWCASE_TEST = "src/screens/showcase/index.test.tsx";
const SHOWCASE_GUIDE = "src/screens/showcase/index.md";
const TRANSLATIONS = "src/features/localization/translations";

/** The `## Section` headings of a catalogue that hold a component table. */
function sectionsOf(file) {
  return [...readFileSync(file, "utf8").matchAll(/^## (.+)$/gm)]
    .map((match) => match[1])
    .filter((name) => !/^(Definition of done|Not documented yet)$/.test(name));
}

/** Adds a row to the end of the table under `## section`. */
function addCatalogueRow(file, section, row) {
  const lines = readFileSync(file, "utf8").split("\n");
  const heading = lines.indexOf(`## ${section}`);
  if (heading === -1) throw new Error(`No "## ${section}" in ${file}`);
  let at = lines.findIndex(
    (line, index) => index > heading && line.startsWith("|"),
  );
  while (lines[at + 1]?.startsWith("|")) at += 1;
  lines.splice(at + 1, 0, row);
  writeFileSync(file, lines.join("\n"));
}

/** Adds a row to the end of the table whose header row starts with `header`. */
function addTableRow(file, header, row) {
  const lines = readFileSync(file, "utf8").split("\n");
  let at = lines.findIndex((line) => line.startsWith(header));
  if (at === -1) throw new Error(`No table starting "${header}" in ${file}`);
  while (lines[at + 1]?.startsWith("|")) at += 1;
  lines.splice(at + 1, 0, row);
  writeFileSync(file, lines.join("\n"));
}

function prettier(files) {
  execFileSync("npx", ["prettier", "--write", ...files], { stdio: "ignore" });
}

export default function (plop) {
  const kebab = plop.getHelper("kebabCase");
  const pascal = plop.getHelper("pascalCase");
  const camel = plop.getHelper("camelCase");

  plop.setActionType("manifest", (answers) => {
    const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
    manifest.COMPONENTS[kebab(answers.name)] = answers.role;
    manifest.COMPONENTS = Object.fromEntries(
      Object.entries(manifest.COMPONENTS).sort(([a], [b]) =>
        a.localeCompare(b),
      ),
    );
    writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
    return `registered in ${MANIFEST}`;
  });

  plop.setActionType("catalogue", (answers, config) => {
    const folder = config.folder;
    const section = answers.role === "internal" ? "Internal" : answers.section;
    addCatalogueRow(
      config.file,
      section,
      `| [**${pascal(answers.name)}**](../../src/${folder}/${kebab(answers.name)}/index.md) | ${answers.description} |`,
    );
    prettier([config.file]);
    return `listed in ${config.file} › ${section}`;
  });

  plop.setActionType("showcase", (answers) => {
    const name = kebab(answers.name);
    const key = camel(answers.name);
    const component = `${pascal(answers.name)}Section`;

    // The section list and its import.
    let source = readFileSync(SHOWCASE, "utf8");
    const imports = [
      ...source.matchAll(/^import .* from "\.\/sections\/.*";$/gm),
    ];
    const lastImport = imports[imports.length - 1];
    const importEnd = lastImport.index + lastImport[0].length;
    source = `${source.slice(0, importEnd)}\nimport ${component} from "./sections/${name}";${source.slice(importEnd)}`;
    source = source.replace(
      /(const SECTIONS[\s\S]*?)(\n\];)/,
      `$1\n  { title: "showcase.${key}", Component: ${component} },$2`,
    );
    writeFileSync(SHOWCASE, source);

    // The title the smoke test expects to find.
    const test = readFileSync(SHOWCASE_TEST, "utf8").replace(
      /(const SECTION_TITLES = \[[\s\S]*?)(\n\];)/,
      `$1\n  ${JSON.stringify(answers.title)},$2`,
    );
    writeFileSync(SHOWCASE_TEST, test);

    // The title in every language — English everywhere until translated.
    for (const file of readdirSync(TRANSLATIONS)) {
      const path = `${TRANSLATIONS}/${file}`;
      const strings = JSON.parse(readFileSync(path, "utf8"));
      strings.showcase[key] = answers.title;
      writeFileSync(path, `${JSON.stringify(strings, null, 2)}\n`);
    }

    // A row in the showcase guide's table.
    addTableRow(
      SHOWCASE_GUIDE,
      "| Section ",
      `| ${answers.title} | ${answers.description} |`,
    );

    prettier([SHOWCASE, SHOWCASE_TEST, SHOWCASE_GUIDE, TRANSLATIONS]);
    return `registered "${answers.title}" (translate showcase.${key} in ${TRANSLATIONS})`;
  });

  plop.setActionType("format", (_answers, config) => {
    prettier([config.path]);
    return `formatted ${config.path}`;
  });

  const description = {
    type: "input",
    name: "description",
    message: "One line: what is it for?",
    validate: (value) => value.trim().length > 0 || "Required",
  };

  plop.setGenerator("component", {
    description: "A kit component in src/components",
    prompts: [
      { type: "input", name: "name", message: "Name (e.g. Rating)" },
      {
        type: "list",
        name: "section",
        message:
          "Catalogue section (Internal = shared by other components only)",
        choices: sectionsOf(COMPONENT_CATALOGUE),
      },
      description,
    ],
    actions: (answers) => {
      const path = "src/components/{{kebabCase name}}";
      // Internal components are kept out of screens by ESLint and need no story.
      answers.role = answers.section === "Internal" ? "internal" : "public";
      return [
        {
          type: "add",
          path: `${path}/index.tsx`,
          templateFile: "templates/component/index.tsx.hbs",
        },
        {
          type: "add",
          path: `${path}/index.test.tsx`,
          templateFile: "templates/component/index.test.tsx.hbs",
        },
        {
          type: "add",
          path: `${path}/index.md`,
          templateFile: "templates/component/index.md.hbs",
          data: {
            section: answers.role === "internal" ? "Internal" : answers.section,
          },
        },
        ...(answers.role === "public"
          ? [
              {
                type: "add",
                path: `${path}/index.stories.tsx`,
                templateFile: "templates/component/index.stories.tsx.hbs",
              },
            ]
          : []),
        { type: "manifest" },
        { type: "catalogue", file: COMPONENT_CATALOGUE, folder: "components" },
        { type: "format", path: `src/components/${kebab(answers.name)}` },
      ];
    },
  });

  plop.setGenerator("feature", {
    description: "An app service in src/features",
    prompts: [
      { type: "input", name: "name", message: "Name (e.g. analytics)" },
      {
        type: "list",
        name: "section",
        message: "Catalogue section",
        choices: sectionsOf(FEATURE_CATALOGUE),
      },
      description,
    ],
    actions: (answers) => {
      const path = "src/features/{{kebabCase name}}";
      return [
        {
          type: "add",
          path: `${path}/index.ts`,
          templateFile: "templates/feature/index.ts.hbs",
        },
        {
          type: "add",
          path: `${path}/index.test.ts`,
          templateFile: "templates/feature/index.test.ts.hbs",
        },
        {
          type: "add",
          path: `${path}/index.md`,
          templateFile: "templates/feature/index.md.hbs",
        },
        { type: "catalogue", file: FEATURE_CATALOGUE, folder: "features" },
        { type: "format", path: `src/features/${kebab(answers.name)}` },
      ];
    },
  });

  plop.setGenerator("screen", {
    description: "A screen in src/screens",
    prompts: [
      { type: "input", name: "name", message: "Name (e.g. profile)" },
      description,
    ],
    actions: (answers) => {
      const path = "src/screens/{{kebabCase name}}";
      return [
        {
          type: "add",
          path: `${path}/index.tsx`,
          templateFile: "templates/screen/index.tsx.hbs",
        },
        {
          type: "add",
          path: `${path}/index.test.tsx`,
          templateFile: "templates/screen/index.test.tsx.hbs",
        },
        {
          type: "add",
          path: `${path}/index.stories.tsx`,
          templateFile: "templates/screen/index.stories.tsx.hbs",
        },
        { type: "format", path: `src/screens/${kebab(answers.name)}` },
      ];
    },
  });

  plop.setGenerator("section", {
    description: "A showcase section",
    prompts: [
      { type: "input", name: "name", message: "Name (e.g. rating)" },
      {
        type: "input",
        name: "title",
        message: "Title shown in the showcase (English)",
      },
      description,
    ],
    actions: (answers) => [
      {
        type: "add",
        path: "src/screens/showcase/sections/{{kebabCase name}}.tsx",
        templateFile: "templates/showcase-section/section.tsx.hbs",
      },
      { type: "showcase" },
      {
        type: "format",
        path: `src/screens/showcase/sections/${kebab(answers.name)}.tsx`,
      },
    ],
  });
}
