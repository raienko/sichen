import {
  getForegroundPermissionsAsync,
  requestForegroundPermissionsAsync,
  type LocationPermissionResponse,
} from "expo-location";

import Permission from "./permission";

/**
 * Foreground ("while using the app") location — enough to centre a map on
 * the user and show what's nearby. Background location is a separate,
 * much heavier ask and isn't requested anywhere.
 */
const locationPermission = new Permission<LocationPermissionResponse>(
  "location",
  {
    get: getForegroundPermissionsAsync,
    request: requestForegroundPermissionsAsync,
  },
);

export default locationPermission;
