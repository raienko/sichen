// This file has been automatically migrated to valid ESM format by Storybook.
import type { StorybookConfig } from "@storybook/react-native-web-vite";
import { loadEnv, type Plugin } from "vite";

/**
 * The icon sets that ship their font as a `require("../fonts/X.ttf")`.
 * Excluded from dependency pre-bundling so the transform below reaches them.
 */
const ICON_FONT_PACKAGES = [
  "@react-native-vector-icons/ant-design",
  "@react-native-vector-icons/feather",
  "@react-native-vector-icons/fontawesome6",
  "@react-native-vector-icons/ionicons",
  "@react-native-vector-icons/material-icons",
];

/**
 * Under Metro, `require("../fonts/Feather.ttf")` is an asset id the icon
 * loader looks up in the asset registry. Vite has no such registry, so the
 * require becomes a module object and every icon fails with "no asset found
 * for font family". The loader also accepts a plain URI, so each font
 * require is swapped for a Vite `?url` import of the same file.
 */
const iconFontUrls: Plugin = {
  name: "app:vector-icon-font-urls",
  enforce: "pre",
  transform(code, id) {
    if (
      !/@react-native-vector-icons\/(?!common\/)[^/]+\/lib\/module\//.test(id)
    ) {
      return null;
    }
    const imports: string[] = [];
    const next = code.replace(
      /require\((["'])([^"']+\.(?:ttf|otf))\1\)/g,
      (_match, _quote, file: string) => {
        const name = `__iconFont${imports.length}`;
        imports.push(`import ${name} from ${JSON.stringify(`${file}?url`)};`);
        return name;
      },
    );
    return imports.length === 0 ? null : `${imports.join("\n")}\n${next}`;
  },
};

const config: StorybookConfig = {
  framework: {
    name: "@storybook/react-native-web-vite",
    options: {
      pluginReactOptions: {
        babel: {
          // What babel-preset-expo adds under Metro. Without it Reanimated's
          // hooks can't find their worklets' dependencies on web and throw on
          // the first render of any animated component (Accordion, Modal,
          // Toast, ProgressBar, Skeleton, Timer).
          plugins: ["react-native-worklets/plugin"],
        },
      },
    },
  },

  stories: ["../src/**/*.stories.?(ts|tsx|js)"],
  // The web app's static files — the map's worker among them.
  staticDirs: ["../public"],

  async viteFinal(viteConfig) {
    // Metro inlines EXPO_PUBLIC_* vars from .env automatically; Vite doesn't,
    // so mirror that here for parity between the on-device and web Storybook.
    const env = loadEnv("development", process.cwd(), "EXPO_PUBLIC_");
    return {
      ...viteConfig,
      plugins: [...(viteConfig.plugins ?? []), iconFontUrls],
      optimizeDeps: {
        ...viteConfig.optimizeDeps,
        exclude: [
          ...(viteConfig.optimizeDeps?.exclude ?? []),
          ...ICON_FONT_PACKAGES,
        ],
        rolldownOptions: {
          ...viteConfig.optimizeDeps?.rolldownOptions,
          // Expo SDK packages (`expo`, `expo-image`, `expo-image-picker`, …)
          // point `main` at their TypeScript source. When the dependency
          // scanner can't parse an entry it retries as JSX unless told the
          // extension's real type, and `import { type X }` then fails to
          // parse and takes the whole dev server down.
          moduleTypes: {
            ...viteConfig.optimizeDeps?.rolldownOptions?.moduleTypes,
            ".ts": "ts",
            ".tsx": "tsx",
          },
          // Once parsed as TypeScript, `expo-modules-core`'s ts-declarations
          // import classes that only exist as `declare class` — erased at
          // compile time, so there's no runtime export to find. They're used
          // purely as types, so an `undefined` stand-in is exactly right.
          shimMissingExports: true,
        },
      },
      define: {
        ...viteConfig.define,
        // Metro inlines the app's base path; here static files sit beside
        // the story pages (src/components/map/index.web.tsx).
        "process.env.EXPO_BASE_URL": JSON.stringify("."),
        ...Object.fromEntries(
          Object.entries(env).map(([key, value]) => [
            `process.env.${key}`,
            JSON.stringify(value),
          ]),
        ),
      },
    };
  },
};

export default config;
