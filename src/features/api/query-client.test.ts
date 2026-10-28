import { ApiError } from "./errors";
import { shouldRetry } from "./query-client";

describe("shouldRetry", () => {
  it("retries network failures, timeouts and server errors, twice at most", () => {
    const offline = new ApiError({ message: "x", isNetworkError: true });
    const server = new ApiError({ message: "x", status: 503 });

    expect(shouldRetry(0, offline)).toBe(true);
    expect(shouldRetry(1, server)).toBe(true);
    expect(shouldRetry(2, server)).toBe(false);
  });

  // The same request is refused the same way, and a 401 retried would
  // force the logout three times.
  it("never retries a client error or a cancelled request", () => {
    expect(shouldRetry(0, new ApiError({ message: "x", status: 401 }))).toBe(
      false,
    );
    expect(shouldRetry(0, new ApiError({ message: "x", status: 404 }))).toBe(
      false,
    );
    expect(
      shouldRetry(0, new ApiError({ message: "x", isCancelled: true })),
    ).toBe(false);
  });
});
