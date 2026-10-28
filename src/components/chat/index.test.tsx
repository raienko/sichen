import { act, fireEvent, render, screen, waitFor } from "@/root/testing";

import { deepLinks } from "@/features/deep-links";

import { ME, PEOPLE, sampleThread } from "./fixtures";
import Component from "./index";

/**
 * Legend List renders nothing without a measured container, which under
 * Jest is always — so, as in `List`'s tests, it's replaced with a stub that
 * renders every row it's handed. What's under test is the rows and what
 * they do, not the virtualization.
 *
 * The last props it got are kept, so a test can fire its `onScroll`.
 */
const mockList: { props?: any } = {};

jest.mock("@legendapp/list/react-native", () => ({
  LegendList: (props: any) => {
    const { View } = jest.requireActual("react-native");
    mockList.props = props;
    return (
      <View>
        {props.ListHeaderComponent}
        {props.data.map((item: any, index: number) => (
          <View key={props.keyExtractor(item, index)}>
            {props.renderItem({ item, index })}
          </View>
        ))}
        {props.ListFooterComponent}
      </View>
    );
  },
}));

jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn(() => Promise.resolve(true)),
}));

// Midday, with the clock pinned to it: "Today" and "Yesterday" are worked
// out from Date.now(), and the fixtures date messages minutes before NOW —
// so run just after midnight against the real clock, they'd be yesterday's.
const NOW = new Date(2026, 9, 15, 12, 0).getTime();

beforeEach(() => {
  jest.spyOn(Date, "now").mockReturnValue(NOW);
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function setup(props: Partial<Parameters<typeof Component>[0]> = {}) {
  const onSend = jest.fn();
  const onAction = jest.fn();
  const view = await render(
    <Component
      messages={sampleThread(NOW)}
      currentUserId={ME}
      participants={PEOPLE}
      onSend={onSend}
      onAction={onAction}
      {...props}
    />,
  );
  return { view, onSend, onAction };
}

describe(`${Component.name} smoke test`, () => {
  it("renders the thread with day separators", async () => {
    await setup();

    // Bubble text is hidden on purpose: the message's one accessible
    // element carries it in its label instead.
    expect(
      screen.getByLabelText(/Ada Lovelace, .*Section G is the interesting one/),
    ).toBeTruthy();
    expect(screen.getByText("Today")).toBeTruthy();
    expect(screen.getByText("Yesterday")).toBeTruthy();
    expect(screen.getByLabelText(/This message was deleted/)).toBeTruthy();
  });

  it("keeps send disabled until there is something to send", async () => {
    const { onSend } = await setup();
    const send = screen.getByRole("button", { name: "Send" });

    expect(send).toBeDisabled();

    await fireEvent.changeText(screen.getByPlaceholderText("Message"), "   ");
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();

    await fireEvent.changeText(
      screen.getByPlaceholderText("Message"),
      "  Hello  ",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Send" }));

    expect(onSend).toHaveBeenCalledWith({ text: "Hello", attachments: [] });
    expect(screen.getByPlaceholderText("Message").props.value).toBe("");
  });

  it("makes a failed receipt a retry button", async () => {
    const { onAction } = await setup();

    await fireEvent.press(
      screen.getByRole("button", { name: "Not sent. Tap to retry" }),
    );

    expect(onAction).toHaveBeenCalledWith(
      { type: "retry" },
      expect.objectContaining({ id: "m8" }),
    );
  });

  it("replies through the screen reader's custom action", async () => {
    const { onSend } = await setup();

    await fireEvent(
      screen.getByLabelText(/Section G is the interesting one/),
      "accessibilityAction",
      { nativeEvent: { actionName: "reply" } },
    );
    expect(screen.getByText("Replying to Ada Lovelace")).toBeTruthy();

    await fireEvent.changeText(screen.getByPlaceholderText("Message"), "Yes");
    await fireEvent.press(screen.getByRole("button", { name: "Send" }));

    expect(onSend).toHaveBeenCalledWith({
      text: "Yes",
      attachments: [],
      replyTo: "m5",
    });
    expect(screen.queryByText("Replying to Ada Lovelace")).toBeNull();
  });

  it("opens the actions sheet and reports a reaction", async () => {
    const { onAction } = await setup();

    await fireEvent(
      // The first is the message itself; the second, its quote in a reply.
      screen.getAllByText("Section G is the interesting one.", {
        includeHiddenElements: true,
      })[0],
      "longPress",
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "React with ❤️" }),
      ).toBeTruthy(),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "React with ❤️" }),
    );

    await waitFor(() =>
      expect(onAction).toHaveBeenCalledWith(
        { type: "react", emoji: "❤️" },
        expect.objectContaining({ id: "m5" }),
      ),
    );
  });

  it("announces what others are doing", async () => {
    await setup({ activity: [{ userId: "ada", kind: "typing" }] });

    expect(screen.getByText("Ada Lovelace is typing…")).toBeTruthy();
  });

  it("shows the empty state, whose chips send", async () => {
    const { onSend } = await setup({
      messages: [],
      emptyState: { suggestions: ["Hi!"] },
    });

    expect(screen.getByText("No messages yet")).toBeTruthy();
    await fireEvent.press(screen.getByText("Hi!"));
    expect(onSend).toHaveBeenCalledWith({ text: "Hi!", attachments: [] });
  });

  it("offers a way back to the newest messages, counting what arrived", async () => {
    const messages = sampleThread(NOW);
    const { view } = await setup({ messages });
    const scrollTo = (y: number) =>
      act(() =>
        mockList.props.onScroll({
          nativeEvent: {
            contentOffset: { y },
            contentSize: { height: 3000 },
            layoutMeasurement: { height: 600 },
          },
        }),
      );

    expect(
      screen.queryByRole("button", { name: /Jump to newest messages/ }),
    ).toBeNull();

    await scrollTo(0);
    expect(
      screen.getByRole("button", { name: "Jump to newest messages" }),
    ).toBeTruthy();

    await view.rerender(
      <Component
        messages={[
          ...messages,
          { id: "new", senderId: "ada", createdAt: NOW, text: "Still there?" },
        ]}
        currentUserId={ME}
        participants={PEOPLE}
        onSend={() => {}}
        onAction={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Jump to newest messages, 1 new" }),
    ).toBeTruthy();

    await fireEvent.press(
      screen.getByRole("button", { name: /Jump to newest messages/ }),
    );
    expect(
      screen.queryByRole("button", { name: /Jump to newest messages/ }),
    ).toBeNull();
  });

  it("reports a press on a sender's avatar as a profile action", async () => {
    const { onAction } = await setup();

    // One button per run Ada opens; the first will do.
    await fireEvent.press(
      screen.getAllByRole("button", { name: "View Ada Lovelace's profile" })[0],
    );

    expect(onAction).toHaveBeenCalledWith(
      {
        type: "profile",
        participant: expect.objectContaining({ id: "ada" }),
      },
      expect.objectContaining({ senderId: "ada" }),
    );
  });

  it("offers the profile as a screen-reader action, never on own messages", async () => {
    const { onAction } = await setup();

    await fireEvent(
      screen.getByLabelText(/Section G is the interesting one/),
      "accessibilityAction",
      { nativeEvent: { actionName: "profile" } },
    );
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: "profile" }),
      expect.objectContaining({ id: "m5" }),
    );

    expect(
      screen.queryByRole("button", { name: "View You's profile" }),
    ).toBeNull();
  });

  describe("links in messages", () => {
    const withLink = () => [
      ...sampleThread(NOW),
      {
        id: "link",
        senderId: "ada",
        createdAt: NOW,
        text: "Agenda: https://example.com/agenda.",
      },
    ];

    it("opens a tapped link through the deep-link pipeline, then reports it", async () => {
      const open = jest.spyOn(deepLinks, "open").mockResolvedValue();
      const { onAction } = await setup({ messages: withLink() });

      // The sentence's full stop stays out of the link.
      await fireEvent.press(
        screen.getByText("https://example.com/agenda", {
          includeHiddenElements: true,
        }),
      );

      expect(open).toHaveBeenCalledWith("https://example.com/agenda");
      expect(onAction).toHaveBeenCalledWith(
        { type: "link", url: "https://example.com/agenda" },
        expect.objectContaining({ id: "link" }),
      );
      open.mockRestore();
    });

    it("offers each link as a screen-reader action on the message", async () => {
      const open = jest.spyOn(deepLinks, "open").mockResolvedValue();
      await setup({ messages: withLink() });
      const message = screen.getByLabelText(/Agenda: https/);

      expect(message.props.accessibilityActions).toContainEqual({
        name: "link:0",
        label: "Open https://example.com/agenda",
      });
      await fireEvent(message, "accessibilityAction", {
        nativeEvent: { actionName: "link:0" },
      });
      expect(open).toHaveBeenCalledWith("https://example.com/agenda");
      open.mockRestore();
    });
  });
});
