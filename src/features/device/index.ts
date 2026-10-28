import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

import env from "@/constants/env";
import { LocalValue } from "@/features/storage";

/**
 * A random id for this install, made on first launch and kept until the
 * app is removed. Not the platform's own ids: Android's and iOS's differ in
 * meaning and timing (iOS's is async), and neither exists on the web — this
 * is the same thing everywhere. It identifies an install, not a person.
 */
const storedInstallId = new LocalValue<string>("device-install-id");

function randomId(): string {
  // RFC 4122 v4 layout; Math.random is fine for an id that only has to be
  // unique per install, not unguessable.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    return (char === "x" ? random : (random & 0x3) | 0x8).toString(16);
  });
}

export function installId(): string {
  const existing = storedInstallId.getValue();
  if (existing) return existing;
  const created = randomId();
  storedInstallId.setValue(created);
  return created;
}

/** The device's current timezone — read each time, since travel changes it. */
export function timezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * What the app and the device it runs on are, read once at launch. Values a
 * platform can't report (the web has no build number or device model) are
 * `"unknown"` rather than `null`, so they can go straight into a header.
 */
export const device = {
  appName: Application.applicationName ?? env.appName,
  /** Marketing version: `1.4.0`. */
  appVersion:
    Application.nativeApplicationVersion ??
    Constants.expoConfig?.version ??
    "unknown",
  /** Build number: `42`. */
  buildNumber: Application.nativeBuildVersion ?? "unknown",
  bundleId: Application.applicationId ?? env.appBundleId,
  /** `ios` | `android` | `web`. */
  platform: Platform.OS,
  osName: Device.osName ?? Platform.OS,
  osVersion: Device.osVersion ?? String(Platform.Version ?? "unknown"),
  /** Hardware id where there is one (`iPhone16,1`), else the marketing name. */
  model: String(Device.modelId ?? Device.modelName ?? "unknown"),
  manufacturer: Device.manufacturer ?? "unknown",
  /** False in a simulator or emulator. */
  isPhysicalDevice: Device.isDevice,
};

/**
 * `app/1.4.0 (42; iOS 18.2; iPhone16,1)` — what the app calls itself in
 * requests, so server logs and analytics can tell builds and devices apart.
 */
export function userAgent(): string {
  return `${env.appSlug}/${device.appVersion} (${device.buildNumber}; ${device.osName} ${device.osVersion}; ${device.model})`;
}

/**
 * The headers every API request carries about the device. `User-Agent` is
 * left out on the web, where browsers forbid scripts from setting it.
 */
export function deviceHeaders(): Record<string, string> {
  return {
    ...(Platform.OS === "web" ? null : { "User-Agent": userAgent() }),
    "X-App-Version": device.appVersion,
    "X-App-Build": device.buildNumber,
    "X-Platform": device.platform,
    "X-Device-Model": device.model,
    "X-OS-Version": device.osVersion,
    "X-Timezone": timezone(),
    "X-Install-Id": installId(),
  };
}
