import { Stack } from "expo-router";

import Root from "@/root";

export default function RootLayout() {
  return (
    <Root>
      <Stack screenOptions={{ headerShown: false }} />
    </Root>
  );
}
