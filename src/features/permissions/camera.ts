import {
  getCameraPermissionsAsync,
  requestCameraPermissionsAsync,
  type CameraPermissionResponse,
} from "expo-image-picker";

import Permission from "./permission";

const cameraPermission = new Permission<CameraPermissionResponse>("camera", {
  get: getCameraPermissionsAsync,
  request: requestCameraPermissionsAsync,
});

export default cameraPermission;
