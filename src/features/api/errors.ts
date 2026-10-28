import { isAxiosError } from "axios";

/**
 * Every failed request, in one shape — whatever axios, the network or the
 * server produced. Screens and TanStack Query's retry rules check `status`
 * and the flags here instead of digging through axios internals.
 */
export class ApiError extends Error {
  /** HTTP status, or `undefined` when no response arrived at all. */
  readonly status: number | undefined;
  /** The server's own error code, when its body carries one (`{ code }`). */
  readonly code: string | undefined;
  /** The response body as received, for anything more specific. */
  readonly data: unknown;
  /** No response: offline, DNS, refused connection, CORS. */
  readonly isNetworkError: boolean;
  readonly isTimeout: boolean;
  readonly isCancelled: boolean;

  constructor(init: {
    message: string;
    status?: number;
    code?: string;
    data?: unknown;
    isNetworkError?: boolean;
    isTimeout?: boolean;
    isCancelled?: boolean;
  }) {
    super(init.message);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.data = init.data;
    this.isNetworkError = init.isNetworkError ?? false;
    this.isTimeout = init.isTimeout ?? false;
    this.isCancelled = init.isCancelled ?? false;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** The server's error code or message, if its body has the usual shape. */
function fromBody(data: unknown): { code?: string; message?: string } {
  if (data === null || typeof data !== "object") return {};
  const body = data as Record<string, unknown>;
  return {
    code: typeof body.code === "string" ? body.code : undefined,
    message: typeof body.message === "string" ? body.message : undefined,
  };
}

/** Turns whatever a request threw into an `ApiError`. */
export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;

  if (isAxiosError(error)) {
    if (error.code === "ERR_CANCELED") {
      return new ApiError({ message: "Request cancelled", isCancelled: true });
    }
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return new ApiError({ message: "Request timed out", isTimeout: true });
    }
    if (error.response === undefined) {
      return new ApiError({
        message: error.message || "Network error",
        isNetworkError: true,
      });
    }
    const { status, data } = error.response;
    const body = fromBody(data);
    return new ApiError({
      message: body.message ?? `Request failed with status ${status}`,
      status,
      code: body.code,
      data,
    });
  }

  return new ApiError({
    message: error instanceof Error ? error.message : String(error),
  });
}
