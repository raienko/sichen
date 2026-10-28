import { AxiosError, type AxiosAdapter, type AxiosResponse } from "axios";

import logger from "@/features/logger";

import { api, apiEvents, configureApi, http } from "./client";
import { ApiError } from "./errors";

type Reply = { status: number; data?: unknown };

/**
 * Stands in for the network: records what each request carried and answers
 * with `reply`. A non-2xx reply is raised the way axios raises it.
 */
let reply: Reply = { status: 200, data: {} };
let sent: Parameters<AxiosAdapter>[0][] = [];

const adapter: AxiosAdapter = async (config) => {
  sent.push(config);
  const response: AxiosResponse = {
    data: reply.data,
    status: reply.status,
    statusText: "",
    headers: {},
    config,
  };
  if (reply.status >= 400) {
    throw new AxiosError("failed", undefined, config, undefined, response);
  }
  return response;
};

let restore: (() => void)[] = [];

const BASE = "https://api.example.com/v1";

beforeEach(() => {
  http.defaults.adapter = adapter;
  http.defaults.baseURL = BASE;
  reply = { status: 200, data: {} };
  sent = [];
  jest.spyOn(logger, "out").mockImplementation(() => {});
  jest.spyOn(logger, "in").mockImplementation(() => {});
  jest.spyOn(logger, "failed").mockImplementation(() => {});
});

afterEach(() => {
  restore.forEach((undo) => undo());
  restore = [];
  configureApi.setTokenProvider(() => undefined);
  configureApi.setResponseFormatter((response) => response.data);
  configureApi.setForceLogoutRule((error) => error.status === 401);
  jest.restoreAllMocks();
});

const lastHeaders = () => sent[sent.length - 1]!.headers;
/** The URL the last request actually went to. */
const lastUrl = () => http.getUri(sent[sent.length - 1]);

describe("api", () => {
  it("resolves with the response body", async () => {
    reply = { status: 200, data: { id: 1 } };

    await expect(api.get("/me")).resolves.toEqual({ id: 1 });
  });

  describe("URLs", () => {
    it("joins a path to the API's base URL, with or without a leading slash", async () => {
      await api.get("users/1");
      expect(lastUrl()).toBe(`${BASE}/users/1`);

      await api.get("/users/2");
      expect(lastUrl()).toBe(`${BASE}/users/2`);
    });

    it("uses an absolute URL as it is", async () => {
      await api.get("https://cdn.example.org/config.json");

      expect(lastUrl()).toBe("https://cdn.example.org/config.json");
    });

    // A third party must never receive the user's session.
    it("sends the token only to the API's own origin", async () => {
      configureApi.setTokenProvider(() => "jwt-1");

      await api.get("https://cdn.example.org/config.json");
      expect(lastHeaders().get("Authorization")).toBeUndefined();

      await api.get("https://API.example.com/v1/me");
      expect(lastHeaders().get("Authorization")).toBe("Bearer jwt-1");
    });

    // `//host` reads as a path but axios sends it to that host.
    it("refuses ambiguous URLs instead of guessing where they go", async () => {
      configureApi.setTokenProvider(() => "jwt-1");

      for (const url of [
        "//evil.example/steal",
        "\\\\evil.example/steal",
        "/\\evil.example",
        " //evil.example",
        "users/1\n",
      ]) {
        sent = [];
        await expect(api.get(url)).rejects.toThrow(/ambiguous request URL/);
        expect(sent).toHaveLength(0);
      }
    });

    it("judges the origin by the configured API, not a baseURL the caller passes", async () => {
      configureApi.setTokenProvider(() => "jwt-1");

      await api.get("me", { baseURL: "https://evil.example" });

      expect(lastUrl()).toBe("https://evil.example/me");
      expect(lastHeaders().get("Authorization")).toBeUndefined();
    });

    it("doesn't force a logout for another origin's 401", async () => {
      const listener = jest.fn();
      restore.push(apiEvents.on("forceLogout", listener));
      reply = { status: 401 };

      await api.get("https://cdn.example.org/private").catch(() => {});

      expect(listener).not.toHaveBeenCalled();
    });
  });

  it("sends the app's own headers on every request", async () => {
    await api.get("/me");

    expect(lastHeaders().get("Accept")).toBe("application/json");
    expect(lastHeaders().get("X-Platform")).toBeTruthy();
    expect(lastHeaders().get("X-App-Version")).toBeTruthy();
  });

  it("adds the access token, unless the request opts out", async () => {
    configureApi.setTokenProvider(async () => "jwt-1");

    await api.get("/me");
    expect(lastHeaders().get("Authorization")).toBe("Bearer jwt-1");

    await api.post("/sign-in", { email: "a" }, { skipAuth: true });
    expect(lastHeaders().get("Authorization")).toBeUndefined();
  });

  it("adds headers from registered providers until they're removed", async () => {
    restore.push(configureApi.addHeaders(() => ({ "Accept-Language": "uk" })));
    const remove = configureApi.addHeaders(() => ({ "X-Flag": "on" }));

    await api.get("/me");
    expect(lastHeaders().get("Accept-Language")).toBe("uk");
    expect(lastHeaders().get("X-Flag")).toBe("on");

    remove();
    await api.get("/me");
    expect(lastHeaders().get("X-Flag")).toBeUndefined();
  });

  it("lets a caller's own header win over a default", async () => {
    await api.get("/file", { headers: { Accept: "text/csv" } });

    expect(lastHeaders().get("Accept")).toBe("text/csv");
  });

  it("formats every response through the formatter", async () => {
    configureApi.setResponseFormatter(
      (response) => (response.data as { data: unknown }).data,
    );
    reply = { status: 200, data: { data: [1, 2], meta: {} } };

    await expect(api.get("/items")).resolves.toEqual([1, 2]);
  });

  it("rejects with an ApiError carrying the server's status and code", async () => {
    reply = {
      status: 422,
      data: { code: "invalid_email", message: "Bad email" },
    };

    const error = await api.post("/users", {}).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 422,
      code: "invalid_email",
      message: "Bad email",
    });
  });

  describe("forced logout", () => {
    it("is raised when the server rejects the session", async () => {
      const listener = jest.fn();
      restore.push(apiEvents.on("forceLogout", listener));
      reply = { status: 401 };

      await expect(api.get("/me")).rejects.toBeInstanceOf(ApiError);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ status: 401 }),
      );
    });

    it("isn't raised for other failures, or for requests sent without a token", async () => {
      const listener = jest.fn();
      restore.push(apiEvents.on("forceLogout", listener));

      reply = { status: 500 };
      await api.get("/me").catch(() => {});
      reply = { status: 401 };
      await api.post("/sign-in", {}, { skipAuth: true }).catch(() => {});

      expect(listener).not.toHaveBeenCalled();
    });

    it("follows a custom rule, such as a server error code", async () => {
      const listener = jest.fn();
      restore.push(apiEvents.on("forceLogout", listener));
      configureApi.setForceLogoutRule(
        (error) => error.code === "session_revoked",
      );
      reply = { status: 403, data: { code: "session_revoked" } };

      await api.get("/me").catch(() => {});

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe("logging", () => {
    it("logs each request and its response through the app logger", async () => {
      await api.post("/posts", { title: "Hi" });

      expect(logger.out).toHaveBeenCalledWith(
        expect.stringMatching(/^#\d+ POST \/posts$/),
        { body: { title: "Hi" } },
      );
      expect(logger.in).toHaveBeenCalledWith(
        expect.stringMatching(/^#\d+ 200 POST \/posts \(\d+ms\)$/),
        {},
      );
    });

    // Two in flight: each response carries the number its request left with,
    // whichever arrives first.
    it("numbers each request, and its response with the same number", async () => {
      await Promise.all([api.get("/a"), api.get("/b")]);

      const number = (line: string) => line.match(/^#(\d+) /)?.[1];
      const out = jest.mocked(logger.out).mock.calls.map(([m]) => m);
      const back = jest.mocked(logger.in).mock.calls.map(([m]) => m);
      const outA = number(out.find((m) => m.endsWith("GET /a"))!);
      const outB = number(out.find((m) => m.endsWith("GET /b"))!);

      expect(outA).not.toBe(outB);
      expect(Number(outB)).toBe(Number(outA) + 1);
      expect(number(back.find((m) => m.includes("GET /a"))!)).toBe(outA);
      expect(number(back.find((m) => m.includes("GET /b"))!)).toBe(outB);
    });

    it("redacts credentials from logged bodies, params and responses", async () => {
      reply = { status: 200, data: { token: "abc", user: { name: "Ada" } } };
      await api.post(
        "/sign-in",
        { email: "ada@example.com", password: "hunter2" },
        { params: { otp: "123456" } },
      );

      expect(logger.out).toHaveBeenCalledWith(expect.any(String), {
        params: { otp: "[redacted]" },
        body: { email: "ada@example.com", password: "[redacted]" },
      });
      expect(logger.in).toHaveBeenCalledWith(expect.any(String), {
        token: "[redacted]",
        user: { name: "Ada" },
      });
    });

    it("logs failures, and nothing for a request that opts out", async () => {
      reply = { status: 500 };
      await api.get("/boom").catch(() => {});
      expect(logger.failed).toHaveBeenCalled();

      jest.mocked(logger.out).mockClear();
      reply = { status: 200 };
      await api.post("/sign-in", { password: "secret" }, { skipLog: true });
      expect(logger.out).not.toHaveBeenCalled();
    });
  });
});
