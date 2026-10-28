import type { SecureAccess } from "../../types";

/**
 * Web: nothing. A browser has no store a page's own scripts can't read, so
 * rather than pretend, secrets live only in the adapter's in-memory mirror
 * — never written to disk, gone on reload. On the web a reload therefore
 * means signing in again, which is the honest cost of not leaving tokens in
 * `localStorage`.
 */
const secureBackend = {
  get: (_key: string): string | undefined => undefined,
  set: (_key: string, _value: string, _access: SecureAccess): void => {},
  remove: async (_key: string): Promise<void> => {},
};

export default secureBackend;
