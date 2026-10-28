import { DEFAULT_DURATION } from "./constants";
import { createEntry, resolveExpiry, startVisibleClocks } from "./entry";

describe("toast entries", () => {
  it("fills in defaults and a unique id", () => {
    const first = createEntry({ message: "Saved" });
    const second = createEntry({ message: "Saved" });

    expect(first).toMatchObject({
      type: "info",
      dismissible: true,
      leaving: false,
      expiresAt: null,
      pendingDuration: DEFAULT_DURATION,
    });
    expect(first.id).not.toBe(second.id);
  });

  it("keeps a caller's id", () => {
    expect(createEntry({ id: "sync", message: "Syncing" }).id).toBe("sync");
  });

  it("lets an absolute expiry win over a duration", () => {
    expect(resolveExpiry(1000, 5000)).toEqual({
      expiresAt: 5000,
      pendingDuration: null,
    });
  });

  it("treats a null duration as never expiring", () => {
    expect(resolveExpiry(null, undefined)).toEqual({
      expiresAt: null,
      pendingDuration: null,
    });
  });

  it("starts the clock only for toasts inside the visible slice", () => {
    const entries = [
      createEntry({ message: "a", duration: 100 }),
      createEntry({ message: "b", duration: 200 }),
    ];

    const [visible, queued] = startVisibleClocks(entries, 1, 1_000);

    expect(visible).toMatchObject({ expiresAt: 1_100, pendingDuration: null });
    expect(queued).toMatchObject({ expiresAt: null, pendingDuration: 200 });
  });
});
