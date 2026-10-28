import logger from "@/features/logger";

import type { StorageAdapter } from "./types";

/**
 * Shared get/set/reset/use implementation for a single stored value, backed
 * by a StorageAdapter. The reset return type follows the backend: local
 * deletion is synchronous, while secure deletion must be awaited.
 */
export default class StorageValue<T, RemoveResult = void> {
  private cachedRaw: string | undefined;
  private cachedValue: T | undefined;
  private hasCached = false;

  constructor(
    private readonly adapter: StorageAdapter<RemoveResult>,
    private readonly key: string,
  ) {}

  private parse(raw: string | undefined): T | undefined {
    if (!this.hasCached || raw !== this.cachedRaw) {
      this.cachedRaw = raw;
      this.cachedValue = raw === undefined ? undefined : this.decode(raw);
      this.hasCached = true;
    }
    return this.cachedValue;
  }

  /**
   * A value that no longer parses — written by an older build, truncated by
   * a crash mid-write, edited by hand in devtools — reads as unset instead
   * of throwing. This runs inside `useValue()`, so a throw here would take
   * down whichever screen reads the key, on every launch, until the app's
   * data is cleared. The raw value is left in place (removing it here would
   * notify subscribers mid-render); the next `setValue` overwrites it.
   */
  private decode(raw: string): T | undefined {
    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      logger.warn(
        `Stored value "${this.key}" is not valid JSON; reading it as unset.`,
        error,
      );
      return undefined;
    }
  }

  getValue(): T | undefined {
    return this.parse(this.adapter.getItem(this.key));
  }

  setValue(value: T): void {
    this.adapter.setItem(this.key, JSON.stringify(value));
  }

  reset(): RemoveResult {
    return this.adapter.removeItem(this.key);
  }

  useValue(): T | undefined {
    return this.parse(this.adapter.useValue(this.key));
  }
}
