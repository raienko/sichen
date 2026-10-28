import { act, fireEvent, render, screen, testId } from "@/root/testing";

import Component from "./index";

/**
 * `expo-video` and `expo-audio` are native modules with no JS
 * implementation under Jest, so both are stubbed with mutable objects that
 * behave the way the real ones do — which is all this component's own
 * logic depends on. The stubs are `mock`-prefixed because a `jest.mock`
 * factory is hoisted above every other binding in the file.
 */
const mockAudioPlayer = {
  playing: false,
  muted: false,
  loop: false,
  play: jest.fn(),
  pause: jest.fn(),
  seekTo: jest.fn(),
};

const mockAudioStatus = {
  playing: false,
  currentTime: 30,
  duration: 120,
  mute: false,
  isLoaded: true,
};

const mockVideoPlayer = {
  playing: false,
  muted: false,
  loop: false,
  currentTime: 15,
  duration: 60,
  timeUpdateEventInterval: 0,
  play: jest.fn(),
  pause: jest.fn(),
};

jest.mock("expo-audio", () => ({
  useAudioPlayer: () => mockAudioPlayer,
  useAudioPlayerStatus: () => mockAudioStatus,
}));

jest.mock("expo-video", () => ({
  useVideoPlayer: (_source: unknown, setup?: (player: unknown) => void) => {
    setup?.(mockVideoPlayer);
    return mockVideoPlayer;
  },
  VideoView: () => null,
}));

jest.mock("expo", () => ({
  ...jest.requireActual("expo"),
  useEvent: (_player: unknown, event: string, initial: unknown) => initial,
}));

describe(`${Component.name} smoke test`, () => {
  afterEach(() => {
    jest.clearAllMocks();
    mockAudioStatus.playing = false;
    mockAudioStatus.mute = false;
    mockVideoPlayer.muted = false;
    mockVideoPlayer.loop = false;
  });

  describe.each(["audio", "video"] as const)("%s", (type) => {
    async function renderPlayer(props: Record<string, unknown> = {}) {
      await render(
        <Component
          type={type}
          source="https://example.com/media"
          label="Episode 12"
          testID="player"
          {...props}
        />,
      );
    }

    // The whole point of one component for both: the transport is the same
    // set of controls, announced the same way, whichever package is behind
    // it.
    it("renders the same transport controls", async () => {
      await renderPlayer();

      expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Mute" })).toBeTruthy();
      expect(
        screen.getByRole("slider", { name: "Playback position" }),
      ).toBeTruthy();
    });

    // Without it a screen reader announces a group of unlabelled buttons
    // with no idea what they control.
    it("names the player itself", async () => {
      await renderPlayer();

      expect(screen.getByLabelText("Episode 12")).toBeTruthy();
    });

    // The region carries `testID`; the controls take a derived one, so
    // neither query is ambiguous.
    it("gives the controls a testID of their own", async () => {
      await renderPlayer();

      expect(screen.getByTestId("player")).toBeTruthy();
      expect(screen.getByTestId(testId("player", "controls"))).toBeTruthy();
    });

    it("shows the clock", async () => {
      await renderPlayer();

      // 0:30 of 2:00 for audio, 0:15 of 1:00 for video.
      expect(screen.getByText(/^\d:\d\d of \d:\d\d$/)).toBeTruthy();
    });
  });

  describe("audio", () => {
    it("plays and pauses through the player", async () => {
      await render(
        <Component
          type="audio"
          source="https://example.com/a.mp3"
          label="Episode 12"
          testID="player"
        />,
      );

      await fireEvent.press(screen.getByRole("button", { name: "Play" }));

      expect(mockAudioPlayer.play).toHaveBeenCalled();
    });

    it("flips the button once it is playing", async () => {
      mockAudioStatus.playing = true;
      await render(
        <Component
          type="audio"
          source="https://example.com/a.mp3"
          label="Episode 12"
        />,
      );

      expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
      expect(screen.queryByRole("button", { name: "Play" })).toBeNull();
    });

    it("mutes through the player", async () => {
      await render(
        <Component
          type="audio"
          source="https://example.com/a.mp3"
          label="Episode 12"
          testID="player"
        />,
      );

      await fireEvent.press(screen.getByRole("button", { name: "Mute" }));

      expect(mockAudioPlayer.muted).toBe(true);
    });

    it("seeks through the player", async () => {
      await render(
        <Component
          type="audio"
          source="https://example.com/a.mp3"
          label="Episode 12"
          testID="player"
        />,
      );

      const thumb = screen.getByRole("slider", { name: "Playback position" });
      await act(() =>
        thumb.props.onAccessibilityAction({
          nativeEvent: { actionName: "increment" },
        }),
      );

      expect(mockAudioPlayer.seekTo).toHaveBeenCalled();
    });
  });

  describe("video", () => {
    // Or `timeUpdate` never fires and the scrubber sits at zero forever.
    it("asks the player to report its progress", async () => {
      await render(
        <Component
          type="video"
          source="https://example.com/v.mp4"
          label="Trip video"
        />,
      );

      expect(mockVideoPlayer.timeUpdateEventInterval).toBeGreaterThan(0);
    });

    it("hides the app's controls when the platform's are used", async () => {
      await render(
        <Component
          type="video"
          source="https://example.com/v.mp4"
          label="Trip video"
          nativeControls
        />,
      );

      expect(screen.queryByRole("button", { name: "Play" })).toBeNull();
    });
  });

  // A player reports 0 until it has read the media's length; scrubbing a
  // zero-length track would divide by nothing.
  it("disables the scrubber until there is a duration", async () => {
    mockAudioStatus.duration = 0;
    await render(
      <Component
        type="audio"
        source="https://example.com/a.mp3"
        label="Episode 12"
      />,
    );

    expect(
      screen.getByRole("slider", { name: "Playback position" }).props
        .accessibilityState.disabled,
    ).toBe(true);
    mockAudioStatus.duration = 120;
  });
});
