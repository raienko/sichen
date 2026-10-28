import type { PermissionResponse } from "expo";

import { LocalValue } from "@/features/storage";

export type PermissionSource<Response extends PermissionResponse> = {
  get: () => Promise<Response>;
  request: () => Promise<Response>;
};

/**
 * Shared API for every OS permission used by the app.
 *
 * The latest response is persisted so it can be read synchronously outside
 * React and observed reactively inside components. `refresh` always asks the
 * operating system for the current value; `request` may show its permission
 * prompt and then stores the resulting value through the same path.
 */
export default class Permission<Response extends PermissionResponse> {
  private readonly value: LocalValue<Response>;

  constructor(
    key: string,
    private readonly source: PermissionSource<Response>,
  ) {
    this.value = new LocalValue<Response>(`permission-${key}`);

    // Migrate responses persisted before the app-level normalization was
    // introduced, so a granted/denied value cannot briefly surface as true
    // before the next lifecycle refresh completes.
    const stored = this.value.getValue();
    if (stored) {
      const normalized = this.normalize(stored);
      if (stored.canAskAgain !== normalized.canAskAgain) {
        this.value.setValue(normalized);
      }
    }
  }

  get(): Response | undefined {
    return this.value.getValue();
  }

  useValue(): Response | undefined {
    return this.value.useValue();
  }

  refresh(): Promise<Response> {
    return this.update(this.source.get);
  }

  request(): Promise<Response> {
    return this.update(this.source.request);
  }

  reset(): void {
    this.value.reset();
  }

  private async update(read: () => Promise<Response>): Promise<Response> {
    const nativeResponse = await read();
    const response = this.normalize(nativeResponse);
    this.value.setValue(response);
    return response;
  }

  private normalize(response: Response): Response {
    return {
      ...response,
      // At the app level, asking again is only a valid action before the
      // user has made a choice. Expo may report true after a grant.
      canAskAgain: response.status === "undetermined" && response.canAskAgain,
    } as Response;
  }
}
