require("@expo/env").load(__dirname, { silent: true });

jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);

require("react-native-gesture-handler/jestSetup");

jest.mock("react-native-reanimated", () =>
  require("react-native-reanimated/mock"),
);

// expo-audio and expo-video are native modules with no JS implementation,
// so importing either throws under Jest — which reaches any test that
// renders a tree containing MediaPlayer, the Showcase included. Stubbed
// here rather than in each of those files, the same reason the three above
// are. A test that cares about playback replaces these with its own.
jest.mock("expo-audio", () => ({
  useAudioPlayer: () => ({
    playing: false,
    muted: false,
    loop: false,
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
  }),
  useAudioPlayerStatus: () => ({
    playing: false,
    currentTime: 0,
    duration: 0,
    mute: false,
    isLoaded: false,
  }),
}));

jest.mock("expo-video", () => ({
  useVideoPlayer: (source, setup) => {
    const player = {
      playing: false,
      muted: false,
      loop: false,
      currentTime: 0,
      duration: 0,
      timeUpdateEventInterval: 0,
      play: jest.fn(),
      pause: jest.fn(),
    };
    setup?.(player);
    return player;
  },
  VideoView: () => null,
}));

// react-native-enriched-markdown renders through a native view, so it can't
// render under Jest. The package ships its own mock for exactly this.
jest.mock("react-native-enriched-markdown", () =>
  require("react-native-enriched-markdown/jest"),
);

// react-native-webview renders a native view, so it can't render under Jest
// and the package ships no mock of its own. Stubbed to a plain View that
// keeps the ref API the bridge drives (`injectJavaScript`, `reload`) and
// exposes the handlers, so a test can post a message *as the page* without
// a browser. Anything that renders the Showcase reaches this too.
jest.mock("react-native-webview", () => {
  const { forwardRef, useImperativeHandle } = require("react");
  const { View } = require("react-native");

  // Every script the app injects, in order. This is the app's only way of
  // talking into the page on native, so a test asserting that a message was
  // sent has to read it from here — see web-view/index.test.tsx.
  const injected = [];
  const reloads = [];

  const WebView = forwardRef((props, ref) => {
    useImperativeHandle(ref, () => ({
      injectJavaScript: (script) => injected.push(script),
      reload: () => reloads.push(true),
      postMessage: jest.fn(),
      stopLoading: jest.fn(),
    }));
    return <View {...props} testID="native-web-view" />;
  });
  WebView.displayName = "WebView";

  return {
    __esModule: true,
    default: WebView,
    WebView,
    __injected: injected,
    __reloads: reloads,
  };
});

// @shopify/react-native-skia ships untranspiled ESM and a native canvas, so
// importing it under Jest fails to parse before it even fails to render.
// Only the pieces Chart touches are stubbed: `matchFont` returns null, which
// is what the component already treats as "this platform gave me no font, so
// draw the axes without labels".
jest.mock("@shopify/react-native-skia", () => ({
  __esModule: true,
  matchFont: () => null,
}));

// Victory Native draws through @shopify/react-native-skia, whose canvas is a
// native surface with no JS renderer under Jest — importing it throws, which
// reaches anything that renders a Chart, the Showcase included. Stubbed to
// plain Views that record what they were asked to draw, so a test can assert
// the series and colours a chart passed down without a canvas to read.
jest.mock("victory-native", () => {
  const { View } = require("react-native");

  const CartesianChart = ({ children, data, xKey, yKeys }) => (
    <View testID="cartesian-chart">
      {children({
        // One point per row per series is enough for the wrapper's own
        // logic; the geometry is Victory's business, not ours.
        points: Object.fromEntries(
          (yKeys ?? []).map((key) => [
            key,
            (data ?? []).map((row) => ({ x: row[xKey], y: row[key] })),
          ]),
        ),
        chartBounds: { left: 0, right: 100, top: 0, bottom: 100 },
      })}
    </View>
  );

  const mark = (name) => {
    const Mark = ({ color, points }) => (
      <View testID={`chart-${name}`} accessibilityValue={{ text: color }}>
        <View
          testID={`chart-${name}-points`}
          accessibilityValue={{ now: (points ?? []).length }}
        />
      </View>
    );
    Mark.displayName = name;
    return Mark;
  };

  // Grouped bars render each series' bar as `BarGroup.Bar`, which records
  // as a plain `bar` mark — so a test counts bars the same way either way.
  const BarGroup = ({ children }) => (
    <View testID="chart-bar-group">{children}</View>
  );
  BarGroup.Bar = mark("bar");

  return {
    __esModule: true,
    CartesianChart,
    Line: mark("line"),
    Area: mark("area"),
    Bar: mark("bar"),
    BarGroup,
  };
});

// MapLibre's native map is a GL surface with no JS renderer under Jest.
// Stubbed to plain Views that keep their children (markers, pins) and
// record the camera and style they were given, so Map's own logic — which
// pins exist, where the camera goes, which colours the style uses — is
// testable without a GPU.
jest.mock("@maplibre/maplibre-react-native", () => {
  const { View } = require("react-native");

  const Map = ({ children, mapStyle, testID, onPress }) => (
    <View
      testID={testID}
      accessibilityValue={{
        text: JSON.stringify(mapStyle?.layers?.[0] ?? null),
      }}
      onPress={onPress}
    >
      {children}
    </View>
  );
  const Camera = (props) => (
    <View
      testID="map-camera"
      accessibilityValue={{ text: JSON.stringify(props) }}
    />
  );
  const Marker = ({ children, id }) => (
    <View testID={`map-marker-${id}`}>{children}</View>
  );

  return { __esModule: true, Map, Camera, Marker };
});

// expo-secure-store has no JS fallback under Jest; a Map stands in for the
// Keychain, with the same sync get/set and async delete the app relies on.
jest.mock("expo-secure-store", () => {
  const store = new Map();
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 1,
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, value);
    },
    deleteItemAsync: async (key) => {
      store.delete(key);
    },
    __store: store,
  };
});

// expo-crypto's random bytes come from a native module; Node's CSPRNG
// stands in, so keys generated under Jest are as random as on a device.
jest.mock("expo-crypto", () => ({
  getRandomValues: (array) => require("crypto").getRandomValues(array),
}));

// expo-network's native module is stubbed by jest-expo without a working
// listener, and TanStack Query subscribes to it in every rendered tree
// (src/features/api/query-client.ts). Online, on Wi-Fi, never changing —
// src/features/network's own test mocks it again to drive changes.
jest.mock("expo-network", () => {
  const state = { isConnected: true, isInternetReachable: true, type: "WIFI" };
  return {
    NetworkStateType: {
      NONE: "NONE",
      UNKNOWN: "UNKNOWN",
      CELLULAR: "CELLULAR",
      WIFI: "WIFI",
      BLUETOOTH: "BLUETOOTH",
      ETHERNET: "ETHERNET",
      WIMAX: "WIMAX",
      VPN: "VPN",
      OTHER: "OTHER",
    },
    getNetworkStateAsync: async () => state,
    addNetworkStateListener: () => ({ remove: () => {} }),
    useNetworkState: () => state,
  };
});
