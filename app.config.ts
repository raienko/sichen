import { existsSync } from "node:fs";

import { parseProjectEnv } from "@expo/env";
import type { ConfigContext, ExpoConfig } from "expo/config";

import type { Env } from "./src/constants/env";

const brand: typeof import("./src/constants/brand").default =
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- see above
  require("./src/constants/brand");

const { version: packageVersion } = require("./package.json") as {
  version: string;
};
const storybookEnabled = process.env.STORYBOOK_ENABLED === "true";

const BRAND_DIR = "./assets/brand/generated";

const brandAsset = (file: string): string => `${BRAND_DIR}/${file}`;

const hasBrandAsset = (projectRoot: string, file: string): boolean =>
  existsSync(`${projectRoot}/${BRAND_DIR}/${file}`);

function readEnv(projectRoot: string): {
  env: Env;
  vars: Record<string, string | undefined>;
} {
  const shell = process.env;
  process.env = { ...shell, EXPO_NO_DOTENV: undefined };
  let files: Record<string, string | undefined>;
  try {
    files = parseProjectEnv(projectRoot, {
      mode: shell.NODE_ENV,
      silent: true,
    }).env;
  } finally {
    process.env = shell;
  }
  const vars = { ...files, ...shell };
  process.env = vars;
  try {
    // Fresh each time: the config is evaluated more than once per command,
    // and the env module reads process.env only when it's first required.
    delete require.cache[require.resolve("./src/constants/env")];
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- see the comment at the top
    return { env: require("./src/constants/env") as Env, vars };
  } finally {
    process.env = shell;
  }
}

function composeExtra(
  extra: ExpoConfig["extra"],
  env: Env,
  vars: Record<string, string | undefined>,
): ExpoConfig["extra"] {
  const projectId = env.projectId ?? vars.EAS_BUILD_PROJECT_ID?.trim();
  if (
    projectId &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      projectId,
    )
  ) {
    throw new Error(
      "EXPO_PUBLIC_EAS_PROJECT_ID must be a valid Expo project UUID.",
    );
  }
  return projectId
    ? { ...extra, eas: { ...extra?.eas, projectId } }
    : { ...extra };
}

const iosAppLinks = (domains: readonly string[]) =>
  domains.length > 0
    ? { associatedDomains: domains.map((domain) => `applinks:${domain}`) }
    : {};

const androidAppLinks = (domains: readonly string[]) =>
  domains.length > 0
    ? {
        intentFilters: [
          {
            action: "VIEW",
            // Verified against /.well-known/assetlinks.json on each domain,
            // which is what lets the link open the app without a chooser.
            autoVerify: true,
            category: ["BROWSABLE", "DEFAULT"],
            data: domains.map((host) => ({ scheme: "https", host })),
          },
        ],
      }
    : {};

export default ({ config, projectRoot }: ConfigContext): ExpoConfig => {
  const { env, vars } = readEnv(projectRoot);
  const owner = vars.EXPO_OWNER?.trim();
  return {
    ...config,
    name: env.appName,
    slug: env.appSlug,
    ...(owner ? { owner } : {}),
    scheme: env.appScheme,
    version: packageVersion,
    orientation: "portrait",
    icon: brandAsset("icon.png"),
    userInterfaceStyle: "automatic",
    ios: {
      ...config.ios,
      bundleIdentifier: env.appBundleId,
      icon: brandAsset("icon-ios.icon"),
      ...iosAppLinks(env.appLinkDomains),
      infoPlist: {
        ...config?.ios?.infoPlist,
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      ...config.android,
      package: env.appBundleId,
      adaptiveIcon: {
        backgroundColor: brand.colors.iconBackground,
        foregroundImage: brandAsset("icon-android-foreground.png"),
        ...(hasBrandAsset(projectRoot, "icon-android-background.png")
          ? { backgroundImage: brandAsset("icon-android-background.png") }
          : {}),
        monochromeImage: brandAsset("icon-android-monochrome.png"),
      },
      predictiveBackGestureEnabled: false,
      allowBackup: false,
      ...androidAppLinks(env.appLinkDomains),
    },
    web: {
      output: "server",
      favicon: brandAsset("favicon.png"),
    },
    extra: composeExtra(config.extra, env, vars),
    plugins: [
      ["expo-router", { unstable_useServerMiddleware: true }],
      "expo-localization",
      "expo-notifications",
      [
        "expo-image-picker",
        {
          photosPermission: `Allow ${env.appName} to choose images from your photo library.`,
          cameraPermission: `Allow ${env.appName} to take photos.`,
          microphonePermission: false,
        },
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission: `Allow ${env.appName} to show places near you.`,
        },
      ],
      "@maplibre/maplibre-react-native",
      ...(storybookEnabled ? ["@react-native-community/datetimepicker"] : []),
      "@react-native-vector-icons/feather",
      "@react-native-vector-icons/material-icons",
      "@react-native-vector-icons/ionicons",
      "@react-native-vector-icons/fontawesome6",
      "@react-native-vector-icons/ant-design",
      [
        "expo-splash-screen",
        {
          backgroundColor: brand.colors.splashBackground,
          image: brandAsset("splash.png"),
          imageWidth: 76,
          ...(brand.colors.splashBackgroundDark
            ? {
                dark: {
                  backgroundColor: brand.colors.splashBackgroundDark,
                  image: brandAsset("splash.png"),
                },
              }
            : {}),
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  };
};
