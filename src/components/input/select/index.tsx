import { forwardRef, useId, useRef, useState } from "react";
import type { TextInput as RNTextInputInstance } from "react-native";

import Icon from "@/components/icon";
import If from "@/components/if";
import Modal, { type ModalHandle } from "@/components/modal";
import Text from "@/components/text";
import { useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import BaseInput from "../base";
import type { CommonInputProps, SelectInputTypeProps } from "../types";
import SelectOptionRow from "./option";

type Props = Omit<SelectInputTypeProps, "type"> & CommonInputProps;

/**
 * Picked, not typed: the field is a button (BaseInput's `onPress` mode) that
 * opens a bottom-sheet Modal listing `options`, and picking one reports its
 * `value` and closes the sheet.
 *
 * `value` is matched against each option's `value`, but what's shown — in
 * the field and in the sheet — is always the option's `label`; an
 * unrecognized (or `null`) value shows the placeholder, so a value arriving
 * from storage that no longer matches any option degrades to "nothing
 * picked" rather than displaying a raw code.
 *
 * The Modal is driven through a ref rather than `Modal.show(id)`, since
 * there's an instance right here to talk to. Its required `id` still has to
 * be unique per instance — two Selects mounted at once would otherwise trip
 * Modal's duplicate-id warning — so it comes from `useId()` rather than
 * anything derived from the label or options.
 */
const SelectInput = forwardRef<RNTextInputInstance, Props>(function SelectInput(
  { value, onChange, options, label, placeholder, rightSlot, ...props },
  ref,
) {
  const theme = useTheme();
  const { spacing } = useSizes();
  const modalId = useId();
  const modal = useRef<ModalHandle>(null);
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);

  function openOptions() {
    setOpen(true);
    modal.current?.show();
  }

  function pick(next: string) {
    onChange(next);
    modal.current?.hide();
  }

  return (
    <>
      <BaseInput
        ref={ref}
        {...props}
        label={label}
        placeholder={placeholder}
        value={selected?.label ?? ""}
        onPress={openOptions}
        expanded={open}
        rightSlot={
          rightSlot ?? (
            <Icon
              name="chevron-down"
              size={spacing.x20}
              color={theme.colors.textSecondary}
            />
          )
        }
      />
      <Modal
        ref={modal}
        id={modalId}
        type="bottomSheet"
        // Closing is the half that can't be tracked from the trigger: the
        // sheet also goes away on a backdrop tap, a drag down and the
        // Android back button, none of which come back through `pick`.
        // (`onClose`, not RN Modal's `onShow` — that one only fires once
        // the OS has finished presenting, which leaves `expanded` reading
        // false for the whole opening animation.)
        onClose={() => setOpen(false)}
      >
        <If condition={label}>
          <Text value={label ?? ""} type="title3" />
        </If>
        {options.map((option) => (
          <SelectOptionRow
            key={option.value}
            option={option}
            selected={option.value === value}
            onPress={pick}
          />
        ))}
      </Modal>
    </>
  );
});

SelectInput.displayName = "SelectInput";

export default SelectInput;
