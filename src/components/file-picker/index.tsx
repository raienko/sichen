import { getDocumentAsync } from "expo-document-picker";
import type {
  DocumentPickerAsset,
  DocumentPickerOptions,
} from "expo-document-picker";
import { useEffect, useRef, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { controlA11yProps } from "@/features/accessibility";
import logger from "@/features/logger";

import { filePickerEventBus } from "./event-bus";

/**
 * `multiple` is fixed, not forwarded: `onChange` reports one asset, and a
 * caller that could receive either one file or several would have to
 * narrow at every call site. A multi-select picker is a different
 * component's job if one is ever needed.
 */
type PickerOptions = Omit<DocumentPickerOptions, "multiple">;

export type FilePickerProps = Omit<
  PressableProps,
  "children" | "onPress" | "style"
> & {
  /** Identifies this picker for `FilePicker.open(id)`. */
  id: string;
  /**
   * What to wrap in the trigger. Omit it to mount the picker headlessly —
   * it renders nothing and only listens for `FilePicker.open(id)`, which is
   * how `Input`'s `file` variation uses it: nesting a pressable field
   * inside a pressable wrapper doesn't work, because React Native has no
   * touch bubbling and the inner one simply wins.
   */
  children?: ReactNode;
  /** Called with the chosen file. Not called at all if the user cancels. */
  onChange: (file: DocumentPickerAsset) => void | Promise<void>;
  /**
   * Passed to `expo-document-picker` — `type` for the MIME types on offer
   * (`"application/pdf"`, `"image/*"`, an array of either), and
   * `copyToCacheDirectory` for whether the file is copied somewhere the
   * rest of Expo can read immediately.
   */
  options?: PickerOptions;
  style?: StyleProp<ViewStyle>;
};

function FilePickerComponent({
  id,
  children,
  onChange,
  options,
  style,
  disabled,
  accessibilityLabel,
  ...pressableProps
}: FilePickerProps) {
  const picking = useRef(false);

  const pick = async () => {
    // A second press while the system browser is open would stack two
    // pickers on native and be ignored on web; either way the first one is
    // the one the user is looking at.
    if (picking.current) return;
    picking.current = true;

    try {
      const result = await getDocumentAsync({
        ...options,
        multiple: false,
      });

      const file = result.canceled ? undefined : result.assets[0];
      if (file) await onChange?.(file);
    } catch (error) {
      logger.failed("Unable to pick a file", error);
    } finally {
      // A cancelled picker resolves normally; failures land here too.
      // Either way the next press has to be able to open another one.
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

  useEffect(
    () =>
      filePickerEventBus.on("open", (requestedId) => {
        if (requestedId === id) void latestPick.current();
      }),
    [id],
  );

  // Headless: no trigger of its own, driven entirely by the static.
  if (children === undefined) return null;

  return (
    <Pressable
      // A plain Pressable has no role of its own, so without this the
      // trigger announces as an anonymous group.
      {...controlA11yProps({
        label: accessibilityLabel,
        disabled: disabled ?? false,
      })}
      {...pressableProps}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      // The trigger is whatever the caller passed, so the feedback can't be
      // a fill it would have to know about — dimming works on any child.
      style={({ pressed }) => [
        style,
        pressed && !disabled ? styles.pressed : null,
      ]}
      // Called directly rather than through the static, so the browser
      // still sees the file dialog as opened by this press.
      onPress={() => void pick()}
    >
      {children}
    </Pressable>
  );
}

type FilePickerStatic = {
  open: (id: string) => void;
};

/**
 * Wraps whatever you give it in a pressable that opens the system file
 * browser, and reports the chosen file.
 *
 * Simpler than `ImagePicker` because the platform is: there is no camera to
 * offer as an alternative and no permission to request first, so there is
 * no chooser sheet in between — pressing the trigger goes straight to the
 * system UI on every platform.
 *
 * `Input`'s `file` variation is this behind a labelled field, which is what
 * most forms want; reach for the component directly when the trigger is
 * something else — a drop zone, an avatar, a row. Mounted without
 * `children` it has no trigger at all and only answers to
 * `FilePicker.open(id)`, which is how that field drives it.
 *
 * @example
 * <FilePicker id="attachment" onChange={setFile}>
 *   <Text value="Choose a file" />
 * </FilePicker>
 * @example
 * <FilePicker id="cv" onChange={setFile} options={{ type: "application/pdf" }}>…</FilePicker>
 */
const FilePicker = FilePickerComponent as typeof FilePickerComponent &
  FilePickerStatic;

/**
 * Opens the picker for `id` from anywhere — no ref needed.
 *
 * Synchronous, and deliberately not a promise: on web the file dialog can
 * only open from the user activation that asked for it, so this has to run
 * inside the press handler that called it, with nothing awaited first.
 * The chosen file arrives through that instance's `onChange`, as it does
 * for a press.
 */
FilePicker.open = (id: string) => {
  filePickerEventBus.emit("open", id);
};

export default FilePicker;

export type { DocumentPickerAsset as FilePickerAsset } from "expo-document-picker";

// Not `createStyles`: nothing here depends on the window, so there is
// nothing for it to recompute.
const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
});
