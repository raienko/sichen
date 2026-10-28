import DeepLinkQueue from "./queue";
import type { DeepLink, DeepLinkGate } from "./types";

const link = (url: string): DeepLink => ({
  url,
  path: "/orders/12",
  params: {},
  query: {},
  initial: false,
});

const entry = (url: string, gates: DeepLinkGate[]) => ({
  link: link(url),
  route: { pattern: "/orders/:id", handle: jest.fn() },
  gates,
});

const allOpen = () => true;

describe("DeepLinkQueue", () => {
  it("holds a link until its gates open", () => {
    const queue = new DeepLinkQueue();
    queue.add(entry("first", ["ready", "auth"]));

    expect(queue.release((gate) => gate === "ready")).toEqual([]);
    expect(queue.size).toBe(1);

    expect(queue.release(allOpen)).toHaveLength(1);
    expect(queue.size).toBe(0);
  });

  it("releases only the links whose own gates are open", () => {
    const queue = new DeepLinkQueue();
    queue.add(entry("open", ["ready"]));
    queue.add(entry("gated", ["ready", "auth"]));

    const released = queue.release((gate) => gate === "ready");

    expect(released.map(({ link: released }) => released.url)).toEqual([
      "open",
    ]);
    expect(queue.size).toBe(1);
  });

  it("releases oldest first, so links run in the order they arrived", () => {
    const queue = new DeepLinkQueue();
    queue.add(entry("first", ["ready"]));
    queue.add(entry("second", ["ready"]));

    expect(
      queue.release(allOpen).map(({ link: released }) => released.url),
    ).toEqual(["first", "second"]);
  });

  it("drops the oldest link once the queue is full, keeping the newest tap", () => {
    const queue = new DeepLinkQueue();
    for (let index = 0; index < 12; index++) {
      queue.add(entry(`link-${index}`, ["auth"]));
    }

    const urls = queue
      .release(allOpen)
      .map(({ link: released }) => released.url);

    expect(urls).toHaveLength(10);
    expect(urls[0]).toBe("link-2");
    expect(urls.at(-1)).toBe("link-11");
  });

  it("clears everything it is holding", () => {
    const queue = new DeepLinkQueue();
    queue.add(entry("first", ["auth"]));

    queue.clear();

    expect(queue.size).toBe(0);
    expect(queue.release(allOpen)).toEqual([]);
  });
});
