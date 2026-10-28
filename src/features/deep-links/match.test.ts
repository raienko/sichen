import { matchPath } from "./match";

describe("matchPath", () => {
  it("matches a static pattern and captures nothing", () => {
    expect(matchPath("/orders", "/orders")).toEqual({});
  });

  it("captures a :param segment", () => {
    expect(matchPath("/orders/:id", "/orders/12")).toEqual({ id: "12" });
  });

  it("captures every :param in a pattern", () => {
    expect(
      matchPath("/users/:user/orders/:id", "/users/ada/orders/12"),
    ).toEqual({ user: "ada", id: "12" });
  });

  it("decodes captured values, which the path deliberately leaves encoded", () => {
    expect(matchPath("/users/:name", "/users/ada%20lovelace")).toEqual({
      name: "ada lovelace",
    });
  });

  it("keeps an encoded slash inside its own segment rather than splitting on it", () => {
    expect(matchPath("/users/:name", "/users/ada%2Flovelace")).toEqual({
      name: "ada/lovelace",
    });
  });

  it("keeps a malformed escape as-is instead of failing the match", () => {
    expect(matchPath("/users/:name", "/users/%zz")).toEqual({ name: "%zz" });
  });

  it("does not match a longer path", () => {
    expect(matchPath("/orders/:id", "/orders/12/items")).toBeNull();
  });

  it("does not match a shorter path", () => {
    expect(matchPath("/orders/:id", "/orders")).toBeNull();
  });

  it("does not match a different static segment", () => {
    expect(matchPath("/orders/:id", "/invoices/12")).toBeNull();
  });

  it("is case-sensitive, as paths are", () => {
    expect(matchPath("/orders/:id", "/Orders/12")).toBeNull();
  });

  it("captures the remaining segments with a trailing *", () => {
    expect(matchPath("/article/*", "/article/2024/hello")).toEqual({
      rest: "2024/hello",
    });
  });

  it("matches a trailing * against nothing left", () => {
    expect(matchPath("/article/*", "/article")).toEqual({ rest: "" });
  });

  it("combines a :param with a trailing *", () => {
    expect(matchPath("/users/:id/*", "/users/12/orders/3")).toEqual({
      id: "12",
      rest: "orders/3",
    });
  });

  it("matches the root pattern against the root path only", () => {
    expect(matchPath("/", "/")).toEqual({});
    expect(matchPath("/", "/orders")).toBeNull();
  });
});
