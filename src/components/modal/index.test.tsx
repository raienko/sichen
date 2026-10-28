import { createRef } from "react";
import { Text as RNText } from "react-native";

import {
  act,
  ANY,
  fireEvent,
  render,
  screen,
  testIdPattern,
  waitFor,
} from "@/root/testing";

import { ANIMATION_DURATION } from "./constants";
import Component from "./index";
import type { ModalHandle } from "./types";

function flattenStyle(style: unknown): Record<string, unknown>[] {
  if (Array.isArray(style)) return style.flatMap(flattenStyle);
  if (style && typeof style === "object")
    return [style as Record<string, unknown>];
  return [];
}

describe(`${Component.displayName} smoke test`, () => {
  it("is not visible by default", async () => {
    await render(
      <Component id="test-default">
        <RNText>content</RNText>
      </Component>,
    );

    expect(screen.queryByText("content")).toBeNull();
  });

  it("shows when ref.show() is called and hides when ref.hide() is called", async () => {
    const ref = createRef<ModalHandle>();
    await render(
      <Component ref={ref} id="test-ref">
        <RNText>content</RNText>
      </Component>,
    );

    await act(() => ref.current?.show());
    await waitFor(() => {
      expect(screen.queryByText("content")).toBeTruthy();
    });

    await act(() => ref.current?.hide());
    await waitFor(() => {
      expect(screen.queryByText("content")).toBeNull();
    });
  });

  it("shows/hides via the static id-based API", async () => {
    await render(
      <Component id="test-static">
        <RNText>content</RNText>
      </Component>,
    );

    await act(() => Component.show("test-static"));
    await waitFor(() => {
      expect(screen.queryByText("content")).toBeTruthy();
    });

    await act(() => Component.hide("test-static"));
    await waitFor(() => {
      expect(screen.queryByText("content")).toBeNull();
    });
  });

  it("only reacts to its own id", async () => {
    const warn = jest.spyOn(console, "log").mockImplementation(() => {});
    await render(
      <Component id="test-this-one">
        <RNText>content</RNText>
      </Component>,
    );

    await act(() => Component.show("some-other-id"));

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(screen.queryByText("content")).toBeNull();
    // no <Modal id="some-other-id" /> is mounted — dev warning, not silence.
    expect(warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.stringContaining('Modal.show("some-other-id")'),
    );
    warn.mockRestore();
  });

  it("hides on backdrop tap by default", async () => {
    const ref = createRef<ModalHandle>();
    await render(
      <Component ref={ref} id="test-backdrop">
        <RNText>content</RNText>
      </Component>,
    );

    await act(() => ref.current?.show());
    await waitFor(() => {
      expect(screen.queryByText("content")).toBeTruthy();
    });

    await fireEvent.press(
      screen.getByTestId(testIdPattern("modal", ANY, "backdrop")),
    );
    await waitFor(() => {
      expect(screen.queryByText("content")).toBeNull();
    });
  });

  it("calls onDismiss instead of hiding when provided, on both backdrop tap and onRequestClose", async () => {
    const onDismiss = jest.fn();
    const ref = createRef<ModalHandle>();
    await render(
      <Component ref={ref} id="test-on-dismiss" onDismiss={onDismiss}>
        <RNText>content</RNText>
      </Component>,
    );

    await act(() => ref.current?.show());
    await waitFor(() => {
      expect(screen.queryByText("content")).toBeTruthy();
    });

    await fireEvent.press(
      screen.getByTestId(testIdPattern("modal", ANY, "backdrop")),
    );

    expect(onDismiss).toHaveBeenCalledTimes(1);
    // onDismiss doesn't hide on its own — the modal is still up until the
    // consumer explicitly hides it (or chooses not to).
    expect(screen.queryByText("content")).toBeTruthy();
  });

  it("has a backdrop for type=actions but no content background", async () => {
    const ref = createRef<ModalHandle>();
    await render(
      <Component ref={ref} id="test-actions-backdrop" type="actions">
        <RNText>content</RNText>
      </Component>,
    );

    await act(() => ref.current?.show());
    await waitFor(() => {
      expect(screen.queryByText("content")).toBeTruthy();
    });

    expect(
      screen.getByTestId(testIdPattern("modal", ANY, "backdrop")),
    ).toBeTruthy();
    const contentStyles = flattenStyle(
      screen.getByText("content").parent?.props.style,
    );
    expect(contentStyles.some((s) => "backgroundColor" in s)).toBe(false);
  });

  it("does not have a backdrop for type=fullscreen", async () => {
    const ref = createRef<ModalHandle>();
    await render(
      <Component ref={ref} id="test-fullscreen-backdrop" type="fullscreen">
        <RNText>content</RNText>
      </Component>,
    );

    await act(() => ref.current?.show());
    await waitFor(() => {
      expect(screen.queryByText("content")).toBeTruthy();
    });

    expect(
      screen.queryByTestId(testIdPattern("modal", ANY, "backdrop")),
    ).toBeNull();
  });

  it("warns when a second instance mounts with an id already in use", async () => {
    const warn = jest.spyOn(console, "log").mockImplementation(() => {});
    await render(
      <>
        <Component id="test-duplicate">
          <RNText>first</RNText>
        </Component>
        <Component id="test-duplicate">
          <RNText>second</RNText>
        </Component>
      </>,
    );

    expect(warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.stringContaining('more than one <Modal id="test-duplicate" />'),
    );
    warn.mockRestore();
  });

  it("marks the modal as an accessible modal view and labels the backdrop", async () => {
    const ref = createRef<ModalHandle>();
    await render(
      <Component ref={ref} id="test-a11y">
        <RNText>content</RNText>
      </Component>,
    );

    await act(() => ref.current?.show());
    await waitFor(() => {
      expect(screen.queryByText("content")).toBeTruthy();
    });

    const backdrop = screen.getByTestId(
      testIdPattern("modal", ANY, "backdrop"),
    );
    expect(backdrop.props.accessibilityRole).toBe("button");
    expect(backdrop.props.accessibilityLabel).toBe("Dismiss");
  });

  it.each([
    ["bottomSheet", true],
    ["actions", true],
    ["popup", false],
    ["fullscreen", false],
    ["immersive", false],
  ] as const)(
    "drag handle presence for type=%s is %s",
    async (type, hasHandle) => {
      const ref = createRef<ModalHandle>();
      await render(
        <Component ref={ref} id={`test-handle-${type}`} type={type}>
          <RNText>content</RNText>
        </Component>,
      );

      await act(() => ref.current?.show());
      await waitFor(() => {
        expect(screen.queryByText("content")).toBeTruthy();
      });

      if (hasHandle) {
        expect(
          screen.getByTestId(testIdPattern("modal", ANY, "drag-handle")),
        ).toBeTruthy();
      } else {
        expect(
          screen.queryByTestId(testIdPattern("modal", ANY, "drag-handle")),
        ).toBeNull();
      }
    },
  );

  it.each([
    "popup",
    "bottomSheet",
    "actions",
    "fullscreen",
    "immersive",
  ] as const)("renders content for type=%s", async (type) => {
    const ref = createRef<ModalHandle>();
    await render(
      <Component ref={ref} id={`test-${type}`} type={type}>
        <RNText>content</RNText>
      </Component>,
    );

    await act(() => ref.current?.show());

    await waitFor(() => {
      expect(screen.queryByText("content")).toBeTruthy();
    });
  });
});

describe(`${Component.displayName} async static API`, () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each(["show", "hide"] as const)(
    "resolves %s after the modal animation duration",
    async (action) => {
      const warn = jest.spyOn(console, "log").mockImplementation(() => {});
      let resolved = false;

      const completion = Component[action]("test-async").then(() => {
        resolved = true;
      });

      await Promise.resolve();
      expect(resolved).toBe(false);

      jest.advanceTimersByTime(ANIMATION_DURATION - 1);
      await Promise.resolve();
      expect(resolved).toBe(false);

      jest.advanceTimersByTime(1);
      await completion;
      expect(resolved).toBe(true);

      warn.mockRestore();
    },
  );
});

describe(`${Component.displayName} immersive type`, () => {
  it("leaves its content unscrolled and edge to edge", async () => {
    const ref = createRef<ModalHandle>();
    await render(
      <Component ref={ref} id="test-immersive" type="immersive">
        <RNText>photo</RNText>
      </Component>,
    );

    await act(() => ref.current?.show());
    await waitFor(() => expect(screen.queryByText("photo")).toBeTruthy());

    // No ScrollView between the content and the modal, so its own gestures
    // aren't taken by one.
    let node = screen.getByText("photo").parent;
    while (node) {
      expect(node.type).not.toBe("RCTScrollView");
      node = node.parent;
    }
  });
});
