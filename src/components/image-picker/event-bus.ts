import { createEventBus } from "@/features/event-bus";

type ImagePickerEvents = {
  /** The id of the picker that should open its gallery. */
  gallery: string;
};

/**
 * Backs `ImagePicker.show(id)` on web, where there is no chooser sheet to
 * put on screen — the static has to reach the mounted instance and run its
 * gallery path directly. Native goes through `Modal`'s own id-based API
 * instead, since there the sheet *is* what `show` opens.
 *
 * Delivery is synchronous, which matters here beyond tidiness: browsers
 * only allow a file dialog to open from the user gesture that asked for it,
 * so an `ImagePicker.show(id)` called inside a press handler has to reach
 * `launchImageLibraryAsync` without a tick in between.
 */
export const imagePickerEventBus = createEventBus<ImagePickerEvents>();
