import {
  addNetworkStateListener,
  getNetworkStateAsync,
  NetworkStateType,
  useNetworkState,
  type NetworkState,
} from "expo-network";

export { NetworkStateType };

export type NetworkStatus = {
  /**
   * The one to branch on: there is a connection and nothing says the
   * internet is unreachable. Unknown counts as online — the state arrives
   * a moment after launch, and an "offline" flash in that moment is worse
   * than a request that fails the normal way.
   */
  isOnline: boolean;
  /** A network is up (Wi-Fi, cellular, …). Not proof the internet is reachable. */
  isConnected: boolean;
  /**
   * Whether the internet answered, where the platform can tell; `undefined`
   * until known. On iOS it is always the same as `isConnected`.
   */
  isInternetReachable: boolean | undefined;
  /** `WIFI`, `CELLULAR`, … — on web, `UNKNOWN` whenever connected. */
  type: NetworkStateType;
};

export function toNetworkStatus(state: NetworkState): NetworkStatus {
  const isConnected = state.isConnected !== false;
  return {
    isOnline: isConnected && state.isInternetReachable !== false,
    isConnected,
    isInternetReachable: state.isInternetReachable,
    type: state.type ?? NetworkStateType.UNKNOWN,
  };
}

/**
 * The connection, live: re-renders when it changes.
 *
 * @example
 * const { isOnline } = useNetworkStatus();
 * <If condition={!isOnline}><OfflineNotice /></If>
 */
export function useNetworkStatus(): NetworkStatus {
  return toNetworkStatus(useNetworkState());
}

/** Just the yes/no, for the common case. */
export function useIsOnline(): boolean {
  return useNetworkStatus().isOnline;
}

/** The connection right now, outside React — before a sync, say. */
export async function getNetworkStatus(): Promise<NetworkStatus> {
  return toNetworkStatus(await getNetworkStateAsync());
}

/**
 * Called on every change, outside React. Returns the unsubscribe.
 *
 * @example
 * const stop = onNetworkChange(({ isOnline }) => isOnline && flushQueue());
 */
export function onNetworkChange(
  listener: (status: NetworkStatus) => void,
): () => void {
  const subscription = addNetworkStateListener((state) =>
    listener(toNetworkStatus(state)),
  );
  return () => subscription.remove();
}
