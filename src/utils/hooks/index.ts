import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, Keyboard, type AppStateStatus } from "react-native";

/**
 * `value`, but only once it has stopped changing for `delay` ms — a search
 * box that queries when typing pauses, not on every key.
 *
 * @example
 * const query = useDebouncedValue(text, 300);
 * useQuery({ queryKey: ["search", query], … });
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

type Debounced<Args extends unknown[]> = ((...args: Args) => void) & {
  /** Drops the pending call. */
  cancel: () => void;
};

/**
 * `callback`, run `delay` ms after the last call — each call restarts the
 * wait. Always runs the latest `callback`, and a pending call is dropped on
 * unmount.
 *
 * @example
 * const save = useDebouncedCallback((text: string) => api.put("/draft", { text }), 500);
 * <Input onChange={save} />
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
): Debounced<Args> {
  const latest = useRef(callback);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    latest.current = callback;
  }, [callback]);
  useEffect(() => () => clearTimeout(timer.current), []);

  return useMemo(() => {
    const debounced = (...args: Args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => latest.current(...args), delay);
    };
    debounced.cancel = () => clearTimeout(timer.current);
    return debounced;
  }, [delay]);
}

/**
 * What `value` was on the previous render where it changed; `undefined`
 * until it first changes.
 *
 * @example
 * const previousCount = usePrevious(count);
 * const direction = previousCount !== undefined && count > previousCount ? "up" : "down";
 */
export function usePrevious<T>(value: T): T | undefined {
  const [current, setCurrent] = useState(value);
  const [previous, setPrevious] = useState<T>();
  // Adjusting state while rendering, as the React docs recommend over an
  // effect: React re-renders straight away, before anything is painted.
  if (!Object.is(value, current)) {
    setPrevious(current);
    setCurrent(value);
  }
  return previous;
}

/**
 * A boolean with a stable `toggle` — for `onPress={toggle}`.
 *
 * @example
 * const [open, toggleOpen, setOpen] = useToggle();
 */
export function useToggle(
  initial = false,
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((current) => !current), []);
  return [value, toggle, setValue];
}

/**
 * Runs `callback` every `delay` ms; `null` pauses it. Always calls the
 * latest `callback`, so it can read current state without restarting.
 *
 * @example
 * useInterval(refresh, isOnline ? seconds(30) : null);
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const tick = useEffectEvent(callback);
  useEffect(() => {
    if (delay === null) return;
    const timer = setInterval(() => tick(), delay);
    return () => clearInterval(timer);
  }, [delay]);
}

/**
 * Runs `callback` once, `delay` ms after mount or after `delay` changes;
 * `null` cancels it.
 *
 * @example
 * useTimeout(() => setHintVisible(false), seconds(5));
 */
export function useTimeout(callback: () => void, delay: number | null): void {
  const fire = useEffectEvent(callback);
  useEffect(() => {
    if (delay === null) return;
    const timer = setTimeout(() => fire(), delay);
    return () => clearTimeout(timer);
  }, [delay]);
}

/** `active`, `background` or `inactive` (iOS, during transitions), live. */
export function useAppState(): AppStateStatus {
  const [state, setState] = useState(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", setState);
    return () => subscription.remove();
  }, []);
  return state;
}

/**
 * Runs `callback` each time the app comes back to the foreground — not on
 * mount. For refreshing what may have changed while it was away.
 *
 * @example
 * useOnForeground(() => queryClient.invalidateQueries({ queryKey: ["inbox"] }));
 */
export function useOnForeground(callback: () => void): void {
  const onForeground = useEffectEvent(callback);
  useEffect(() => {
    let previous = AppState.currentState;
    const subscription = AppState.addEventListener("change", (next) => {
      if (previous !== "active" && next === "active") onForeground();
      previous = next;
    });
    return () => subscription.remove();
  }, []);
}

export type KeyboardState = {
  isVisible: boolean;
  /** The keyboard's height in points; `0` while hidden. */
  height: number;
};

/**
 * Whether the software keyboard is up, and how tall it is. Uses the `Did`
 * events, which both platforms send (iOS's `Will` events are earlier, but
 * Android doesn't have them).
 */
export function useKeyboard(): KeyboardState {
  const [state, setState] = useState<KeyboardState>(() =>
    // react-native-web's Keyboard has neither (its types say otherwise) and
    // never fires the events, so on web this always reads as hidden.
    typeof Keyboard.metrics !== "function"
      ? { isVisible: false, height: 0 }
      : {
          isVisible: Keyboard.isVisible(),
          height: Keyboard.metrics()?.height ?? 0,
        },
  );
  useEffect(() => {
    const shown = Keyboard.addListener("keyboardDidShow", (event) =>
      setState({ isVisible: true, height: event.endCoordinates.height }),
    );
    const hidden = Keyboard.addListener("keyboardDidHide", () =>
      setState({ isVisible: false, height: 0 }),
    );
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);
  return state;
}
