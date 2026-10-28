import { registerTrigger } from "./index.web";

// Jest runs without a DOM here, so `window` gets just the two methods the
// shortcut uses, backed by a plain EventTarget.
const target = new EventTarget();
Object.assign(window, {
  addEventListener: target.addEventListener.bind(target),
  removeEventListener: target.removeEventListener.bind(target),
});

const press = (keys: Partial<KeyboardEvent>) => {
  const event = Object.assign(new Event("keydown"), {
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault: () => {},
    ...keys,
  });
  target.dispatchEvent(event);
};

describe("dev menu web shortcut", () => {
  it("opens on Ctrl+Shift+D or ⌘+Shift+D, until unregistered", () => {
    const open = jest.fn();
    const unregister = registerTrigger(open);

    press({ key: "D", ctrlKey: true, shiftKey: true });
    press({ key: "d", metaKey: true, shiftKey: true });
    press({ key: "d", ctrlKey: true });
    expect(open).toHaveBeenCalledTimes(2);

    unregister();
    press({ key: "D", ctrlKey: true, shiftKey: true });
    expect(open).toHaveBeenCalledTimes(2);
  });
});
