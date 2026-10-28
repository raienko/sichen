import { Checkbox as ExpoCheckbox, Switch as ExpoSwitch } from "@expo/ui";
import { useState } from "react";
import { View } from "react-native";

import Text from "@/components/text";

import Component from "./index";

const meta = {
  title: "components/internal/ExpoUIHost",
  component: Component,
};

export default meta;

/**
 * Raw Expo UI controls inside the host, with no app-owned row around them —
 * what the `type="expo"` adapters start from. Switch the theme or an RTL
 * locale to see the host pass the scheme, seed colour and direction through.
 */
export const Default = () => {
  const [checked, setChecked] = useState(true);
  const [on, setOn] = useState(false);

  return (
    <View>
      <Text value="Expo UI controls, themed by the host" type="footnote" />
      <Component matchContents>
        <ExpoCheckbox value={checked} onValueChange={setChecked} />
      </Component>
      <Component matchContents>
        <ExpoSwitch value={on} onValueChange={setOn} />
      </Component>
    </View>
  );
};
