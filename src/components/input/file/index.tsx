import { forwardRef, useId } from "react";
import type { TextInput as RNTextInputInstance } from "react-native";

import FilePicker from "@/components/file-picker";
import Icon from "@/components/icon";
import { useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import BaseInput from "../base";
import type { CommonInputProps, FileInputTypeProps } from "../types";

type Props = Omit<FileInputTypeProps, "type"> & CommonInputProps;

/**
 * Picked, not typed: the field is a button (BaseInput's `onPress` mode)
 * that opens the system file browser, and choosing a file reports it.
 *
 * The field shows the file's own `name` — never its `uri`, which is a
 * cache path on native and a blob URL on web, and means nothing to anyone
 * reading it. With no file chosen it shows the placeholder, the same as
 * `select`.
 *
 * The picker's required `id` comes from `useId()` rather than the label:
 * two file fields on one form would otherwise share an id, and
 * `FilePicker.open(id)` would open both.
 */
const FileInput = forwardRef<RNTextInputInstance, Props>(function FileInput(
  { value, onChange, options, label, placeholder, rightSlot, ...props },
  ref,
) {
  const theme = useTheme();
  const { spacing } = useSizes();
  const pickerId = useId();

  return (
    <>
      {/*
        Headless: the field below is the trigger. It can't be nested inside
        the picker's own pressable — React Native has no touch bubbling, so
        the inner pressable would swallow every press and the outer one
        would never fire.
      */}
      <FilePicker
        id={pickerId}
        onChange={onChange}
        options={options}
        disabled={props.disabled}
      />
      <BaseInput
        ref={ref}
        {...props}
        label={label}
        placeholder={placeholder}
        value={value?.name ?? ""}
        // Synchronous all the way to `getDocumentAsync`: the bus delivers
        // in place, so the browser still counts this press as the user
        // activation that opened the file dialog.
        onPress={() => FilePicker.open(pickerId)}
        rightSlot={
          rightSlot ?? (
            <Icon
              name="paperclip"
              size={spacing.x20}
              color={theme.colors.textSecondary}
            />
          )
        }
      />
    </>
  );
});

FileInput.displayName = "FileInput";

export default FileInput;
