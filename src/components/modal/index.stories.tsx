import { useRef } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import Text from "@/components/text";

import Component from "./index";
import type { ModalHandle } from "./types";

const meta = {
  title: "components/Modal",
  component: Component,
};

export default meta;

function Demo({
  id,
  type,
}: {
  id: string;
  type: "popup" | "bottomSheet" | "actions" | "fullscreen";
}) {
  const ref = useRef<ModalHandle>(null);

  return (
    <View>
      <Button value={`Show ${type}`} onPress={() => ref.current?.show()} />
      <Component ref={ref} id={id} type={type}>
        <Text value={`This is a "${type}" modal.`} />
        <Button value="Close" onPress={() => ref.current?.hide()} />
      </Component>
    </View>
  );
}

export const Popup = () => <Demo id="story-popup" type="popup" />;
export const BottomSheet = () => (
  <Demo id="story-bottom-sheet" type="bottomSheet" />
);
export const Actions = () => <Demo id="story-actions" type="actions" />;
export const Fullscreen = () => (
  <Demo id="story-fullscreen" type="fullscreen" />
);
