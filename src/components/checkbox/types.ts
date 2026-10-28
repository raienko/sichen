import type {
  BinaryControlImplementationProps,
  BinaryControlProps,
} from "@/components/types";

export type CheckboxProps = BinaryControlProps;
export type CheckboxImplementationProps = BinaryControlImplementationProps;

export type CheckboxIndicatorProps = Pick<CheckboxProps, "value"> & {
  disabled: boolean;
};
