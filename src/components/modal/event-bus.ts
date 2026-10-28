import { createEventBus } from "@/features/event-bus";

type ModalEvents = {
  show: string;
  hide: string;
};

/**
 * Backs the `id`-based Modal.show(id)/Modal.hide(id) API — every mounted
 * `<Modal id="..." />` subscribes for its own id in index.tsx, so emitting
 * here reaches the right instance without a ref.
 */
export const modalEventBus = createEventBus<ModalEvents>();
