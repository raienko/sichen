import { AccessibilityInfo } from "react-native";

/** Native platforms can report whether VoiceOver or TalkBack is running. */
export default function readScreenReaderEnabled(): Promise<boolean> {
  return AccessibilityInfo.isScreenReaderEnabled();
}
