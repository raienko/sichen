import {
  getPermissionsAsync,
  requestPermissionsAsync,
  type NotificationPermissionsStatus,
} from "expo-notifications";

import Permission from "./permission";

const notificationsPermission = new Permission<NotificationPermissionsStatus>(
  "notifications",
  {
    get: getPermissionsAsync,
    request: requestPermissionsAsync,
  },
);

export default notificationsPermission;
