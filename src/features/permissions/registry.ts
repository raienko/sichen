import camera from "./camera";
import gallery from "./gallery";
import location from "./location";
import notifications from "./notifications";

async function refresh() {
  const [
    cameraResponse,
    galleryResponse,
    locationResponse,
    notificationsResponse,
  ] = await Promise.all([
    camera.refresh(),
    gallery.refresh(),
    location.refresh(),
    notifications.refresh(),
  ]);

  return {
    camera: cameraResponse,
    gallery: galleryResponse,
    location: locationResponse,
    notifications: notificationsResponse,
  };
}

/** Every permission requested by the app, exposed through one API. */
const permissions = {
  camera,
  gallery,
  location,
  notifications,
  refresh,
};

export default permissions;
