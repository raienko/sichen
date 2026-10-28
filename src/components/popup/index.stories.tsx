import { useState, type ReactNode } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import Text from "@/components/text";

import Component from "./index";

const meta = {
  title: "components/Popup",
  component: Component,
};

export default meta;

function Demo({
  children,
}: {
  children: (report: (text: string) => void) => ReactNode;
}) {
  const [last, setLast] = useState("—");

  return (
    <View>
      {children(setLast)}
      <Text value={`Last callback: ${last}`} type="footnote" />
    </View>
  );
}

export const Confirmation = () => (
  <Demo>
    {(report) => (
      <>
        <Button
          value="Show popup"
          onPress={() => Component.show("story-popup")}
        />
        <Component
          id="story-popup"
          title="Publish changes?"
          message="Everyone with access will see them."
          onConfirm={() => report("confirmed")}
          onCancel={() => report("cancelled")}
        />
      </>
    )}
  </Demo>
);

export const Alert = () => (
  <Demo>
    {(report) => (
      <>
        <Button
          value="Show alert"
          onPress={() => Component.show("story-alert")}
        />
        <Component
          id="story-alert"
          type="alert"
          title="Changes saved"
          message="Alerts have a single OK action."
          onConfirm={() => report("acknowledged")}
        />
      </>
    )}
  </Demo>
);

export const Prompt = () => (
  <Demo>
    {(report) => (
      <>
        <Button
          value="Show prompt"
          onPress={() => Component.show("story-prompt")}
        />
        <Component
          id="story-prompt"
          type="prompt"
          title="Name this draft"
          inputLabel="Draft name"
          placeholder="Quarterly plan"
          onConfirm={(value) => report(`prompt: ${value || "empty"}`)}
          onCancel={() => report("cancelled")}
        />
      </>
    )}
  </Demo>
);
