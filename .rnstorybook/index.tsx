import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerRootComponent } from "expo";

import { view } from "./storybook.requires";

const StorybookUIRoot = view.getStorybookUI({
  storage: {
    getItem: AsyncStorage.getItem,
    setItem: AsyncStorage.setItem,
  },
});

// This file replaces expo-router/entry as the app entry (via the Metro
// resolver swap in metro.config.js) when STORYBOOK_ENABLED=true, so it must
// self-register the root component the same way expo-router/entry does.
registerRootComponent(StorybookUIRoot);
