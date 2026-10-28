import {
  getMediaLibraryPermissionsAsync,
  requestMediaLibraryPermissionsAsync,
  type MediaLibraryPermissionResponse,
} from "expo-image-picker";

import Permission from "./permission";

const galleryPermission = new Permission<MediaLibraryPermissionResponse>(
  "gallery",
  {
    get: () => getMediaLibraryPermissionsAsync(false),
    request: () => requestMediaLibraryPermissionsAsync(false),
  },
);

export default galleryPermission;
