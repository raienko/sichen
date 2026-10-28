import { openURL } from "expo-linking";
import { router } from "expo-router";

import env from "@/constants/env";

import deepLinks, { deepLinkEvents } from ".";

jest.mock("expo-linking", () => ({ openURL: jest.fn() }));
jest.mock("expo-router", () => ({ router: { navigate: jest.fn() } }));

const navigate = jest.mocked(router.navigate);
const openExternal = jest.mocked(openURL);

const link = (path: string) => `${env.appScheme}://${path}`;

/** Anything registered has to clear the built-in `ready` gate first. */
function markReady() {
  deepLinks.setGate("ready", true);
}

describe("deepLinks", () => {
  beforeEach(() => {
    deepLinks.reset();
    jest.clearAllMocks();
  });

  describe("open", () => {
    it("runs the handler of the route whose pattern matches", async () => {
      const handle = jest.fn();
      deepLinks.register({ pattern: "/orders/:id", handle });
      markReady();

      await deepLinks.open(link("orders/12"));

      expect(handle).toHaveBeenCalledWith(
        expect.objectContaining({ path: "/orders/12", params: { id: "12" } }),
      );
    });

    it("passes the query string to the handler alongside the path params", async () => {
      const handle = jest.fn();
      deepLinks.register({ pattern: "/orders/:id", handle });
      markReady();

      await deepLinks.open(link("orders/12?ref=email"));

      expect(handle).toHaveBeenCalledWith(
        expect.objectContaining({ query: { ref: "email" } }),
      );
    });

    it("navigates when the handler returns an href", async () => {
      deepLinks.register({ pattern: "/orders/:id", handle: () => "/" });
      markReady();

      await deepLinks.open(link("orders/12"));

      expect(navigate).toHaveBeenCalledWith("/");
    });

    it("navigates nowhere when the handler returns nothing", async () => {
      deepLinks.register({ pattern: "/orders/:id", handle: () => undefined });
      markReady();

      await deepLinks.open(link("orders/12"));

      expect(navigate).not.toHaveBeenCalled();
    });

    it("uses the first matching route, so order is priority", async () => {
      const first = jest.fn();
      const second = jest.fn();
      deepLinks.register({ pattern: "/orders/new", handle: first });
      deepLinks.register({ pattern: "/orders/:id", handle: second });
      markReady();

      await deepLinks.open(link("orders/new"));

      expect(first).toHaveBeenCalled();
      expect(second).not.toHaveBeenCalled();
    });

    it("navigates to an unregistered path, leaving Expo Router to resolve it", async () => {
      markReady();

      await deepLinks.open(link("settings"));

      expect(navigate).toHaveBeenCalledWith("/settings");
    });

    it("preserves query parameters when it navigates to an unregistered path", async () => {
      markReady();

      await deepLinks.open("/settings?tab=security&tag=a&tag=b");

      expect(navigate).toHaveBeenCalledWith({
        pathname: "/settings",
        params: { tab: "security", tag: ["a", "b"] },
      });
    });

    it("hands a URL that is not ours to the OS instead of routing it", async () => {
      markReady();

      await deepLinks.open("tel:5555555");

      expect(openExternal).toHaveBeenCalledWith("tel:5555555");
      expect(navigate).not.toHaveBeenCalled();
    });

    it("takes a bare path, the shape a push payload usually carries", async () => {
      const handle = jest.fn();
      deepLinks.register({ pattern: "/orders/:id", handle });
      markReady();

      await deepLinks.open("/orders/12");

      expect(handle).toHaveBeenCalledWith(
        expect.objectContaining({ params: { id: "12" } }),
      );
    });

    it("survives a handler that throws", async () => {
      deepLinks.register({
        pattern: "/orders/:id",
        handle: () => {
          throw new Error("nope");
        },
      });
      markReady();

      await expect(deepLinks.open(link("orders/12"))).resolves.toBeUndefined();
    });
  });

  describe("gates", () => {
    it("holds a link until the app opens the gate it named", async () => {
      const handle = jest.fn();
      deepLinks.register({ pattern: "/account", gates: ["auth"], handle });
      markReady();

      await deepLinks.open(link("account"));
      expect(handle).not.toHaveBeenCalled();
      expect(deepLinks.pending()).toHaveLength(1);

      deepLinks.setGate("auth", true);

      expect(handle).toHaveBeenCalled();
      expect(deepLinks.pending()).toHaveLength(0);
    });

    it("holds every link until `ready`, so nothing runs before the app is up", async () => {
      const handle = jest.fn();
      deepLinks.register({ pattern: "/orders/:id", handle });

      await deepLinks.open(link("orders/12"));
      expect(handle).not.toHaveBeenCalled();

      markReady();

      expect(handle).toHaveBeenCalled();
    });

    it("keeps holding a link whose other gate is still closed", async () => {
      const handle = jest.fn();
      deepLinks.register({ pattern: "/account", gates: ["auth"], handle });

      await deepLinks.open(link("account"));
      deepLinks.setGate("auth", true);

      expect(handle).not.toHaveBeenCalled();
      expect(deepLinks.pending()).toHaveLength(1);

      markReady();

      expect(handle).toHaveBeenCalled();
    });

    it("reports whether a gate is open", () => {
      expect(deepLinks.isGateOpen("auth")).toBe(false);

      deepLinks.setGate("auth", true);
      expect(deepLinks.isGateOpen("auth")).toBe(true);

      deepLinks.setGate("auth", false);
      expect(deepLinks.isGateOpen("auth")).toBe(false);
    });
  });

  describe("receive", () => {
    it("runs the handler for a link the OS delivered", async () => {
      const handle = jest.fn();
      deepLinks.register({ pattern: "/orders/:id", handle });
      markReady();

      await deepLinks.receive(link("orders/12"), false);

      expect(handle).toHaveBeenCalledWith(
        expect.objectContaining({ params: { id: "12" } }),
      );
    });

    /**
     * The difference from `open`: Expo Router keeps its own Linking
     * subscription and is already routing OS URLs by file, so navigating
     * here as well would push the same screen twice.
     */
    it("leaves an unregistered path alone, since Expo Router is routing it", async () => {
      markReady();

      await deepLinks.receive(link("settings"), false);

      expect(navigate).not.toHaveBeenCalled();
    });

    it("still navigates when a registered handler asks it to", async () => {
      deepLinks.register({ pattern: "/orders/:id", handle: () => "/" });
      markReady();

      await deepLinks.receive(link("orders/12"), false);

      expect(navigate).toHaveBeenCalledWith("/");
    });

    it("tells a handler when the link is what launched the app", async () => {
      const handle = jest.fn();
      deepLinks.register({ pattern: "/orders/:id", handle });
      markReady();

      await deepLinks.receive(link("orders/12"), true);

      expect(handle).toHaveBeenCalledWith(
        expect.objectContaining({ initial: true }),
      );
    });

    it("handles the same initial URL only once", async () => {
      const handle = jest.fn();
      deepLinks.register({ pattern: "/orders/:id", handle });
      markReady();

      await deepLinks.receive(link("orders/12"), true);
      await deepLinks.receive(link("orders/12"), true);

      expect(handle).toHaveBeenCalledTimes(1);
    });

    it("holds a cold-start link until the navigator is ready", async () => {
      const handle = jest.fn();
      deepLinks.register({ pattern: "/orders/:id", handle });

      await deepLinks.receive(link("orders/12"), true);
      expect(handle).not.toHaveBeenCalled();

      markReady();

      expect(handle).toHaveBeenCalled();
    });

    it("ignores a URL that is not ours rather than handing it to the OS", async () => {
      markReady();

      await deepLinks.receive("tel:5555555", false);

      expect(openExternal).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
    });

    it("survives a handler that throws", async () => {
      deepLinks.register({
        pattern: "/orders/:id",
        handle: () => {
          throw new Error("nope");
        },
      });
      markReady();

      await expect(
        deepLinks.receive(link("orders/12"), true),
      ).resolves.toBeUndefined();
    });
  });

  describe("events", () => {
    it("announces a link once its handler has run", async () => {
      const listener = jest.fn();
      deepLinkEvents.on("handled", listener);
      deepLinks.register({ pattern: "/orders/:id", handle: jest.fn() });
      markReady();

      await deepLinks.open(link("orders/12"));

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ path: "/orders/12" }),
      );
    });

    it("announces a link that was parked, and the gates it still needs", async () => {
      const listener = jest.fn();
      deepLinkEvents.on("deferred", listener);
      deepLinks.register({
        pattern: "/account",
        gates: ["auth"],
        handle: jest.fn(),
      });
      markReady();

      await deepLinks.open(link("account"));

      expect(listener).toHaveBeenCalledWith({
        link: expect.objectContaining({ path: "/account" }),
        gates: ["auth"],
      });
    });
  });

  describe("register", () => {
    it("reports whether the registry claims a URL", () => {
      deepLinks.register({ pattern: "/orders/:id", handle: jest.fn() });

      expect(deepLinks.claims(link("orders/12"))).toBe(true);
      expect(deepLinks.claims(link("settings"))).toBe(false);
      expect(deepLinks.claims("https://not-ours.example/orders/12")).toBe(
        false,
      );
    });

    it("stops matching once the returned function is called", async () => {
      const handle = jest.fn();
      const unregister = deepLinks.register({ pattern: "/orders/:id", handle });
      markReady();

      unregister();
      await deepLinks.open(link("orders/12"));

      expect(handle).not.toHaveBeenCalled();
    });

    it("replaces a pattern registered twice, rather than shadowing the second", async () => {
      const first = jest.fn();
      const second = jest.fn();
      deepLinks.register({ pattern: "/orders/:id", handle: first });
      deepLinks.register({ pattern: "/orders/:id", handle: second });
      markReady();

      await deepLinks.open(link("orders/12"));

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalled();
    });

    it("lists every registered pattern in match order", () => {
      deepLinks.register({ pattern: "/orders/new", handle: jest.fn() });
      deepLinks.register({ pattern: "/orders/:id", handle: jest.fn() });

      expect(deepLinks.patterns()).toEqual(["/orders/new", "/orders/:id"]);
    });
  });
});
