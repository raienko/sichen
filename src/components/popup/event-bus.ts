import { createEventBus } from "@/features/event-bus";

type PopupEvents = {
  willShow: string;
};

/** Lets a mounted Popup prepare local state before its Modal is presented. */
export const popupEventBus = createEventBus<PopupEvents>();
