import "@tanstack/react-query";

import type { ApiError } from "./errors";

/**
 * Every query and mutation fails with an `ApiError`, and `meta.persist`
 * is the one meta key the app reads — typed here so `error.status` and
 * `meta: { persist: true }` need no casts at the call site.
 */
declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ApiError;
    /** `persist: true` keeps a successful result on disk between launches. */
    queryMeta: { persist?: boolean };
  }
}
