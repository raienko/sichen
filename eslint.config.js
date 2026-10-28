// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const globals = require("globals");

const { COMPONENTS } = require("./src/components/manifest.json");

/** Deep imports into another module's folder, past its entry point. */
const MODULE_BOUNDARY = [
  {
    group: ["@/components/*/**", "@/features/*/**"],
    message:
      "Import through the module's entry point ('@/components/<name>', '@/features/<name>'); files inside the folder are private to it.",
  },
];

/**
 * Which layer may import which (ADR 0005), checked on the file an import
 * resolves to — so `@/screens/x` and `../../screens/x` are the same import.
 * `src/app` composes the root and screens; the root and screens compose
 * shared code; shared code reaches none of them.
 */
const LAYER_ZONES = [
  {
    target: [
      "./src/components",
      "./src/features",
      "./src/utils",
      "./src/constants",
    ],
    from: ["./src/app", "./src/screens", "./src/root"],
    message:
      "Shared modules cannot import routes, screens or the app root. Move shared behavior into a feature or component instead (ADR 0005).",
  },
  {
    target: "./src/screens",
    from: ["./src/app", "./src/root"],
    message:
      "Screens compose features and components; route registration and app providers belong in src/app and src/root (ADR 0005).",
  },
  {
    target: "./src/root",
    from: ["./src/app", "./src/screens"],
    message:
      "The app root cannot depend on routes or screens; src/app composes the root and a screen (ADR 0005).",
  },
];

const UNITS_SNAPSHOT = {
  paths: [
    {
      name: "@/features/responsive",
      importNames: ["unitsSnapshot"],
      message:
        "unitsSnapshot() doesn't update on resize. Use useUnits() (or createStyles()) inside a component instead.",
    },
  ],
  patterns: [
    {
      group: ["@/features/responsive/units"],
      message:
        "Import from '@/features/responsive' and use useUnits() instead — unitsSnapshot() doesn't update on resize.",
    },
  ],
};

/** Components listed as internal in src/components/manifest.json. */
const INTERNAL_COMPONENTS = Object.entries(COMPONENTS)
  .filter(([, role]) => role === "internal")
  .map(([name]) => ({
    group: [`@/components/${name}`],
    message: `'${name}' is an internal building block for other components (src/components/manifest.json), not part of the public UI kit.`,
  }));

/**
 * Design-system boundaries (see the block that uses it below): raw Text and
 * Image primitives, raw colours and ad-hoc type styles.
 */
const DESIGN_SYSTEM_SYNTAX = [
  {
    selector:
      "ImportDeclaration[source.value='react-native'] ImportSpecifier[imported.name='Text']",
    message:
      "Use '@/components/text' so app typography, color and direction are applied.",
  },
  {
    selector: "ImportDeclaration[source.value='expo-image']",
    message:
      "Use '@/components/image' so fallback and accessibility behavior are applied.",
  },
  {
    selector:
      "ImportDeclaration[source.value=/^@expo\\/ui(?:\\/(?:jetpack-compose|swift-ui))?$/] ImportSpecifier[imported.name='Host']",
    message:
      "Use '@/components/expo-ui-host' so Expo controls receive the app color scheme, seed color and layout direction.",
  },
  {
    selector: "Literal[value=/^(#[0-9A-Fa-f]{3,8}|rgba?\\(|hsla?\\()/]",
    message: "Use a semantic color from useTheme() instead of a raw UI color.",
  },
  {
    selector: "Literal[value=/^(black|white|red|blue|green|gray|grey)$/]",
    message:
      "Use a semantic color from useTheme() instead of a named UI color.",
  },
  {
    selector:
      "Property[key.name=/^(fontFamily|fontSize|fontWeight|lineHeight|letterSpacing)$/]",
    message:
      "Use a typography token from Text or createStyles() instead of defining an ad-hoc type style.",
  },
];

/**
 * Test ids follow one format — `testId()` from @/utils, or a named constant
 * for something the app renders once (the toasts overlay) — so they can't
 * drift or collide. A string written into `testID` inside a component would
 * be the same id on every instance of it.
 */
const TEST_ID_SYNTAX = [
  {
    selector: "JSXAttribute[name.name='testID'] > Literal",
    message:
      "Derive the id with testId() from @/utils (or a named constant for an app-wide singleton) instead of writing it out.",
  },
  {
    selector:
      "JSXAttribute[name.name='testID'] > JSXExpressionContainer > TemplateLiteral",
    message:
      "Build the id with testId(owner, ...parts) from @/utils instead of a template string.",
  },
];

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  // Root-level config files run under Node (app.config.ts, metro.config.js,
  // .storybook/*, jest.setup.js), unlike src/, which runs in the app bundle.
  {
    files: [
      "*.config.{js,ts}",
      ".storybook/**/*.{js,ts,tsx}",
      ".rnstorybook/**/*.{js,ts,tsx}",
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["jest.setup.js"],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
    },
  },
  // Import boundaries, one block per area so no two blocks set the same rule
  // for the same file (flat config replaces a rule's options rather than
  // merging them). Tests are exempt: they reach into internals on purpose.
  //
  // - MODULE_BOUNDARY: a component or feature is imported through its
  //   folder's entry point, never a file inside it.
  // - INTERNAL_COMPONENTS: building blocks for other components, not the UI
  //   kit — only src/components may use them.
  // - UNITS_SNAPSHOT: unitsSnapshot() is a point-in-time read
  //   (Dimensions.get at call time) — fine in plain utility/feature code,
  //   but inside a component it silently goes stale on resize instead of
  //   updating like useUnits() does.
  {
    files: ["src/components/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: UNITS_SNAPSHOT.paths,
          patterns: [...MODULE_BOUNDARY, ...UNITS_SNAPSHOT.patterns],
        },
      ],
    },
  },
  {
    files: ["src/screens/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: UNITS_SNAPSHOT.paths,
          patterns: [
            ...MODULE_BOUNDARY,
            ...INTERNAL_COMPONENTS,
            ...UNITS_SNAPSHOT.patterns,
          ],
        },
      ],
    },
  },
  {
    files: ["src/root/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: UNITS_SNAPSHOT.paths,
          patterns: [
            ...MODULE_BOUNDARY,
            ...INTERNAL_COMPONENTS,
            ...UNITS_SNAPSHOT.patterns,
          ],
        },
      ],
    },
  },
  {
    files: [
      "src/features/**/*.{ts,tsx}",
      "src/utils/**/*.{ts,tsx}",
      "src/constants/**/*.{ts,tsx}",
    ],
    ignores: ["**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [...MODULE_BOUNDARY, ...INTERNAL_COMPONENTS],
        },
      ],
    },
  },
  {
    files: ["src/app/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [...MODULE_BOUNDARY, ...INTERNAL_COMPONENTS] },
      ],
    },
  },
  // Layer boundaries (LAYER_ZONES above). The TypeScript resolver follows
  // the `@/` alias from tsconfig.json; with only the Node resolver an alias
  // import resolves to nothing and the rule silently skips it.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}"],
    settings: {
      "import/resolver": {
        // Merged with eslint-config-expo's own `node` resolver, which keeps
        // the platform extensions (.web.ts, .ios.tsx, …).
        typescript: { project: "./tsconfig.json" },
      },
    },
    rules: {
      "import/no-restricted-paths": [
        "error",
        { basePath: __dirname, zones: LAYER_ZONES },
      ],
    },
  },
  // Design-system boundaries are enforceable rules, not review-time
  // conventions. Only their implementation files may reach the raw text and
  // image primitives; UI consumers use the wrappers that supply typography,
  // theme, fallback and accessibility behavior. The same boundary keeps raw
  // color literals and ad-hoc type scales out of component styles.
  {
    files: [
      "src/app/**/*.{ts,tsx}",
      "src/components/**/*.{ts,tsx}",
      "src/root/**/*.{ts,tsx}",
      "src/screens/**/*.{ts,tsx}",
    ],
    ignores: [
      "**/*.test.{ts,tsx}",
      "src/components/image/index.tsx",
      "src/components/text/index.tsx",
      "src/components/expo-ui-host/index.tsx",
    ],
    rules: {
      "no-restricted-syntax": ["error", ...DESIGN_SYSTEM_SYNTAX],
    },
  },
  // Components also hold to the test-id format. Same rule as the block
  // above, so it carries the design-system selectors along — a later block
  // replaces an earlier one's options rather than adding to them.
  {
    files: ["src/components/**/*.{ts,tsx}"],
    ignores: [
      "**/*.test.{ts,tsx}",
      "**/*.stories.tsx",
      "src/components/image/index.tsx",
      "src/components/text/index.tsx",
      "src/components/expo-ui-host/index.tsx",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...DESIGN_SYSTEM_SYNTAX,
        ...TEST_ID_SYNTAX,
      ],
    },
  },
  {
    files: [
      "src/components/image/index.tsx",
      "src/components/text/index.tsx",
      "src/components/expo-ui-host/index.tsx",
    ],
    rules: {
      "no-restricted-syntax": ["error", ...TEST_ID_SYNTAX],
    },
  },
]);
