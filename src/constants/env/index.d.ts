declare const env: {
  readonly appName: string;
  readonly appSlug: string;
  readonly appScheme: string;
  readonly appBundleId: string;
  readonly projectId: string | undefined;
  readonly appLinkDomains: readonly string[];
  /** Base URL of the backend API, without a trailing slash; unset until a brand has one. */
  readonly apiUrl: string | undefined;
  /** A build made for end-to-end tests (`EXPO_PUBLIC_E2E=1`). Use `isE2E` from @/utils. */
  readonly e2e: boolean;
};

export type Env = typeof env;

export default env;
