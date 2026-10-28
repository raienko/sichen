import { useSyncExternalStore } from "react";

import type { StateViewOverlayEntry, StateViewOverlayOptions } from "./types";

let nextId = 0;

type StateViewPresentation = {
  entry: StateViewOverlayEntry | null;
  visible: boolean;
};

const EMPTY_PRESENTATION: StateViewPresentation = {
  entry: null,
  visible: false,
};

/** Single global screen-state overlay, independent of the React tree. */
class StateViewStore {
  private current: StateViewOverlayEntry | null = null;
  private presentation = EMPTY_PRESENTATION;
  private readonly listeners = new Set<() => void>();

  get(): StateViewOverlayEntry | null {
    return this.current;
  }

  getPresentation(): StateViewPresentation {
    return this.presentation;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Shows a new overlay, replacing the current one, and returns its id. */
  show({ id, ...props }: StateViewOverlayOptions): string {
    nextId += 1;
    const resolvedId = id ?? `state-view-${nextId}`;
    this.current = { ...props, id: resolvedId };
    this.presentation = { entry: this.current, visible: true };
    this.notify();
    return resolvedId;
  }

  /**
   * Hides the active overlay. Supplying its id prevents stale async work from
   * accidentally hiding a newer overlay that replaced it.
   */
  hide(id?: string): void {
    if (this.current === null) return;
    if (id !== undefined && id !== this.current.id) return;
    this.current = null;
    this.presentation = { ...this.presentation, visible: false };
    this.notify();
  }

  /** Releases outgoing content after Modal has completed its exit animation. */
  completeHide(): void {
    if (this.current !== null || this.presentation.entry === null) return;
    this.presentation = EMPTY_PRESENTATION;
    this.notify();
  }

  /** Clears global state immediately; intended for test isolation. */
  reset(): void {
    this.current = null;
    this.presentation = EMPTY_PRESENTATION;
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}

const stateViews = new StateViewStore();

export function useStateViewOverlay(): StateViewOverlayEntry | null {
  return useSyncExternalStore(
    (listener) => stateViews.subscribe(listener),
    () => stateViews.get(),
    () => stateViews.get(),
  );
}

export function useStateViewPresentation(): StateViewPresentation {
  return useSyncExternalStore(
    (listener) => stateViews.subscribe(listener),
    () => stateViews.getPresentation(),
    () => stateViews.getPresentation(),
  );
}

export default stateViews;
