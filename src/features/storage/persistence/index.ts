/**
 * Whether anything written to storage will actually survive a restart.
 *
 * Always true on native: MMKV writes to a real file, and there's no user
 * setting that quietly turns that off. The web build has its own answer —
 * see persistence.web.ts.
 */
export function isStoragePersistent(): boolean {
  return true;
}
