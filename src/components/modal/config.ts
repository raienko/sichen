import type { ModalType } from "./types";

export type ModalPosition = "center" | "bottom" | "fullscreen";
export type ModalAnimation = "fade" | "slideUp";

export type ModalTypeConfig = {
  position: ModalPosition;
  animation: ModalAnimation;
  /** Whether a dimmed, tap-to-dismiss layer renders behind the content. */
  backdrop: boolean;
  /** How dark that layer gets once fully shown. */
  backdropOpacity: number;
  /**
   * Whether the content wrapper itself gets theme.colors.background. Off
   * for "actions", a bare stack of items, and "immersive", which draws edge
   * to edge over its own media.
   */
  contentBackground: boolean;
  /**
   * Whether children sit in Modal's ScrollView. Off for `immersive`, whose
   * content runs its own gestures (pinch, pan, swipe-to-dismiss) that a
   * surrounding ScrollView would steal.
   */
  scroll: boolean;
  /** Content runs to every edge: no padding and no top inset of Modal's own. */
  edgeToEdge: boolean;
};

/**
 * What visually differs between Modal's `type`s. Add a new type by adding
 * one entry here (+ the literal to ModalType in ./types.ts) — index.tsx
 * reads these generically and doesn't need to change.
 */
export const MODAL_TYPE_CONFIG: Record<ModalType, ModalTypeConfig> = {
  popup: {
    position: "center",
    animation: "fade",
    backdrop: true,
    backdropOpacity: 0.5,
    contentBackground: true,
    scroll: true,
    edgeToEdge: false,
  },
  bottomSheet: {
    position: "bottom",
    animation: "slideUp",
    backdrop: true,
    backdropOpacity: 0.5,
    contentBackground: true,
    scroll: true,
    edgeToEdge: false,
  },
  actions: {
    position: "bottom",
    animation: "slideUp",
    backdrop: true,
    // Barely dimmed: with no surface of its own, the items read against
    // the page itself, so the page shouldn't go dark behind them.
    backdropOpacity: 0.2,
    // No surface: a stack of items straight over the backdrop, like a
    // native action sheet.
    contentBackground: false,
    scroll: true,
    edgeToEdge: false,
  },
  fullscreen: {
    position: "fullscreen",
    animation: "fade",
    backdrop: false,
    backdropOpacity: 0,
    contentBackground: true,
    scroll: true,
    edgeToEdge: false,
  },
  immersive: {
    position: "fullscreen",
    animation: "fade",
    backdrop: false,
    backdropOpacity: 0,
    contentBackground: false,
    scroll: false,
    edgeToEdge: true,
  },
};
