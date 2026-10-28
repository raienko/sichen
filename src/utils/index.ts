import { Platform } from "react-native";

export { easeOutClamped } from "./easing";
export * from "./build";
export * from "./hooks";
export * from "./test-id";
export * from "./time";

/**
 * Which platform the app is running on, as three constants rather than a
 * comparison repeated at every call site.
 *
 * Read from `Platform.OS` rather than `process.env.EXPO_OS`, which is the
 * other way to ask. The env read is inlined by `babel-preset-expo` at
 * transform time, so it collapses to a literal and the branches it guards
 * are dead-code-eliminated per platform — cheaper, but it also means that
 * under Jest it is permanently `"ios"`, and any behaviour behind it can
 * never be exercised by a test. `Platform.OS` costs one comparison at
 * module load and leaves the other branches in the bundle; being able to
 * prove platform-specific behaviour is worth more than that.
 *
 * Constants, not functions: the platform can't change while the app runs,
 * so there is nothing to re-evaluate and a call site reads as a fact rather
 * than a question.
 *
 * A test that needs a different platform mocks this module rather than
 * `react-native`'s `Platform` — replacing that one breaks
 * `expo-modules-core`, which reads `select` from it during setup:
 *
 * ```ts
 * jest.mock("@/utils", () => ({
 *   ...jest.requireActual("@/utils"),
 *   isWeb: true,
 * }));
 * ```
 */
export const isWeb = Platform.OS === "web";
export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";
