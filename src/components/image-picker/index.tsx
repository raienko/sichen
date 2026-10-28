import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import * as ExpoImagePicker from "expo-image-picker";

import Button from "@/components/button";
import If from "@/components/if";
import Modal from "@/components/modal";
import Text from "@/components/text";
import { controlA11yProps } from "@/features/accessibility";
import { useLocale } from "@/features/localization";
import logger from "@/features/logger";
import { permissions } from "@/features/permissions";
import { isWeb } from "@/utils";

import { imagePickerEventBus } from "./event-bus";

type PickerOptions = Omit<
  ExpoImagePicker.ImagePickerOptions,
  | "allowsMultipleSelection"
  | "mediaTypes"
  | "orderedSelection"
  | "selectionLimit"
>;

export type ImagePickerProps = Omit<
  PressableProps,
  "children" | "onPress" | "style"
> & {
  /** Identifies this picker for ImagePicker.show(id)/ImagePicker.hide(id). */
  id: string;
  children: ReactNode;
  onChange: (image: ExpoImagePicker.ImagePickerAsset) => void | Promise<void>;
  options?: PickerOptions;
  style?: StyleProp<ViewStyle>;
};

type PickerSource = "camera" | "gallery";

const SHEET_ID_PREFIX = "image-picker:";

/**
 * The web build has no camera to offer. `launchCameraAsync` there is the
 * same `<input type="file">` the gallery opens, only with a `capture`
 * attribute browsers on a desktop ignore entirely — so a chooser sheet
 * would be asking the user to pick between one option and a copy of it.
 * Pressing the trigger goes straight to the file dialog instead.
 *
 * `isWeb` comes from `@/utils` rather than `process.env.EXPO_OS`, which
 * `babel-preset-expo` inlines at transform time: under Jest that read is
 * permanently `"ios"`, and this branch would ship with no test able to
 * reach it. See the note there.
 */

function sheetId(id: string): string {
  return `${SHEET_ID_PREFIX}${id}`;
}

function ImagePickerComponent({
  id,
  children,
  onChange,
  options,
  style,
  disabled,
  accessibilityLabel,
  ...pressableProps
}: ImagePickerProps) {
  const { t } = useLocale();
  const picking = useRef(false);
  const [open, setOpen] = useState(false);

  const launch = (source: PickerSource) => {
    const pickerOptions: ExpoImagePicker.ImagePickerOptions = {
      ...options,
      allowsMultipleSelection: false,
      mediaTypes: ["images"],
    };

    return source === "camera"
      ? ExpoImagePicker.launchCameraAsync(pickerOptions)
      : ExpoImagePicker.launchImageLibraryAsync(pickerOptions);
  };

  const pick = async (source: PickerSource) => {
    if (picking.current) return;
    picking.current = true;

    try {
      let result: ExpoImagePicker.ImagePickerResult;

      if (isWeb) {
        // No sheet to close first, which is also what keeps this correct:
        // browsers only allow a file dialog to open from the user gesture
        // that asked for it, so `launch` has to be reached from the press
        // handler with nothing awaited in between.
        result = await launch(source);
      } else {
        // A native picker is itself a modal activity/controller. Waiting for
        // our sheet's exit prevents the OS from dismissing both together.
        await ImagePicker.hide(id);

        if (source === "camera") {
          const currentPermission = permissions.camera.get();
          const cameraPermission = currentPermission?.granted
            ? currentPermission
            : await permissions.camera.request();
          if (!cameraPermission?.granted) return;
        }

        result = await launch(source);
      }

      const image = result.canceled ? undefined : result.assets[0];
      if (image) await onChange?.(image);
    } catch (error) {
      logger.failed(`Unable to pick image from ${source}`, error);
    } finally {
      // A canceled native picker resolves normally; failures land here too.
      // Either way, the next press must be able to launch another picker.
      picking.current = false;
    }
  };

  // `pick` closes over this render's props, so the subscription reads it
  // through a ref rather than being torn down and rebuilt every render.
  // Written in an effect rather than during render, which is both what the
  // lint rule asks for and correct: the subscription can only fire after a
  // commit anyway.
  const latestPick = useRef(pick);
  useEffect(() => {
    latestPick.current = pick;
  });

  // Only the web build listens: there, `ImagePicker.show(id)` has no sheet
  // to open and has to reach this instance instead. Native's static goes
  // through Modal, which already knows how to find the right one by id.
  useEffect(() => {
    if (!isWeb) return;

    return imagePickerEventBus.on("gallery", (requestedId) => {
      if (requestedId === id) void latestPick.current("gallery");
    });
  }, [id]);

  return (
    <>
      <Pressable
        {...controlA11yProps({
          label: accessibilityLabel,
          disabled: disabled ?? false,
          // A sheet is the only thing there is to expand. On web the press
          // opens the file dialog directly, so announcing an expanded state
          // would describe a disclosure that doesn't exist.
          ...(isWeb ? null : { expanded: open }),
        })}
        {...pressableProps}
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        style={({ pressed }) => [
          style,
          pressed && !disabled ? styles.pressed : null,
        ]}
        // Called directly rather than through the static, so the browser
        // still sees the file dialog as opened by this press.
        onPress={() =>
          isWeb ? void pick("gallery") : void ImagePicker.show(id)
        }
      >
        {children}
      </Pressable>

      <If condition={!isWeb}>
        <Modal
          id={sheetId(id)}
          type="bottomSheet"
          onShow={() => setOpen(true)}
          onClose={() => setOpen(false)}
        >
          <Text value={t("imagePicker.title")} type="title3" />
          <Button
            value={t("imagePicker.gallery")}
            onPress={() => void pick("gallery")}
          />
          <Button
            value={t("imagePicker.camera")}
            onPress={() => void pick("camera")}
          />
        </Modal>
      </If>
    </>
  );
}

type ImagePickerStatic = {
  show: (id: string) => Promise<void>;
  hide: (id: string) => Promise<void>;
};

const ImagePicker = ImagePickerComponent as typeof ImagePickerComponent &
  ImagePickerStatic;

/**
 * Opens the picker for `id`: the chooser sheet on native, the file dialog
 * directly on web. Awaiting it on web resolves once the dialog has been
 * asked for, not once a file has been chosen — the same as native, where it
 * resolves when the sheet has finished animating in.
 */
ImagePicker.show = async (id: string) => {
  if (isWeb) {
    imagePickerEventBus.emit("gallery", id);
    return;
  }
  await Modal.show(sheetId(id));
};

/** Closes the chooser sheet. A no-op on web, which never opened one. */
ImagePicker.hide = async (id: string) => {
  if (isWeb) return;
  await Modal.hide(sheetId(id));
};

export default ImagePicker;

// Not `createStyles`: nothing here depends on the window, so there is
// nothing for it to recompute.
const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
});
