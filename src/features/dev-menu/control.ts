import Modal from "@/components/modal";
import { isDebug } from "@/utils";

export const DEV_MENU_ID = "dev-menu";

/**
 * Opens and closes the in-app dev menu from anywhere. Debug builds only
 * (`isDebug`): in production and in an end-to-end run `isEnabled` is
 * `false`, nothing is mounted and these do nothing.
 */
export const devMenu = {
  isEnabled: isDebug,
  open: () => {
    if (isDebug) Modal.show(DEV_MENU_ID);
  },
  close: () => {
    if (isDebug) Modal.hide(DEV_MENU_ID);
  },
};
