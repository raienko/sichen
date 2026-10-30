import { Platform } from "react-native";

/**
 * Fullscreen for the web build: no tabs or address bar. Browsers only grant
 * it from a tap or key press, so the game asks on the first one. iPhone
 * Safari has no fullscreen for pages; there the way is "Add to Home
 * Screen", which already opens the game standalone (see +html.tsx).
 */
type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};
type FsDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

const web = Platform.OS === "web" && typeof document !== "undefined";

/** Launched from the home screen: already without browser chrome. */
export function isStandalone(): boolean {
  if (!web) return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function canFullscreen(): boolean {
  if (!web || isStandalone()) return false;
  const el = document.documentElement as FsElement;
  return !!(el.requestFullscreen || el.webkitRequestFullscreen);
}

export function isFullscreen(): boolean {
  if (!web) return false;
  const doc = document as FsDocument;
  return !!(doc.fullscreenElement ?? doc.webkitFullscreenElement);
}

export function enterFullscreen() {
  if (!canFullscreen() || isFullscreen()) return;
  const el = document.documentElement as FsElement;
  try {
    const out = el.requestFullscreen
      ? el.requestFullscreen({ navigationUI: "hide" })
      : el.webkitRequestFullscreen?.();
    // Refusals (no gesture, a policy) are fine: the game works either way.
    void Promise.resolve(out).catch(() => {});
  } catch {
    // Same as above.
  }
}

export function exitFullscreen() {
  if (!isFullscreen()) return;
  const doc = document as FsDocument;
  void Promise.resolve(
    doc.exitFullscreen ? doc.exitFullscreen() : doc.webkitExitFullscreen?.(),
  ).catch(() => {});
}

/** Asks for fullscreen on the first tap or key press of this visit. */
export function fullscreenOnFirstTap(): () => void {
  if (!canFullscreen()) return () => {};
  const go = () => {
    enterFullscreen();
    stop();
  };
  const stop = () => {
    window.removeEventListener("pointerup", go);
    window.removeEventListener("keydown", go);
  };
  window.addEventListener("pointerup", go);
  window.addEventListener("keydown", go);
  return stop;
}

/** iPhone Safari: a page can't go fullscreen; the home screen app can. */
export function needsHomeScreen(): boolean {
  if (!web || isStandalone() || canFullscreen()) return false;
  return /iPhone|iPod/.test(navigator.userAgent);
}
