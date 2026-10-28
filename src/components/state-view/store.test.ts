import stateViews from "./store";

beforeEach(() => stateViews.reset());
afterEach(() => stateViews.reset());

describe("StateViewStore", () => {
  it("replaces the active overlay", () => {
    stateViews.show({ id: "first", type: "loading" });
    stateViews.show({ id: "second", type: "error", message: "Failed" });

    expect(stateViews.get()).toMatchObject({
      id: "second",
      type: "error",
      message: "Failed",
    });
  });

  it("does not let stale work hide a newer overlay", () => {
    stateViews.show({ id: "first", type: "loading" });
    stateViews.show({ id: "second", type: "success" });

    stateViews.hide("first");
    expect(stateViews.get()?.id).toBe("second");

    stateViews.hide("second");
    expect(stateViews.get()).toBeNull();
  });

  it("retains outgoing content until the modal finishes hiding", () => {
    stateViews.show({ id: "loading", type: "loading" });
    stateViews.hide("loading");

    expect(stateViews.get()).toBeNull();
    expect(stateViews.getPresentation()).toMatchObject({
      entry: { id: "loading", type: "loading" },
      visible: false,
    });

    stateViews.completeHide();
    expect(stateViews.getPresentation()).toEqual({
      entry: null,
      visible: false,
    });
  });
});
