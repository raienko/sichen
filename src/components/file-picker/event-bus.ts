import { createEventBus } from "@/features/event-bus";

type FilePickerEvents = {
  /** The id of the picker that should open the system file browser. */
  open: string;
};

/**
 * Backs `FilePicker.open(id)`. Unlike `Modal`'s bus this is the *only* way
 * the static reaches an instance — a file picker has no sheet of its own to
 * show, on any platform, so there's nothing else to drive.
 *
 * Delivery is synchronous, which matters beyond tidiness: browsers only
 * allow a file dialog to open from the user activation that asked for it,
 * so a `FilePicker.open(id)` called inside a press handler has to reach
 * `getDocumentAsync` without a tick in between.
 */
export const filePickerEventBus = createEventBus<FilePickerEvents>();
