import type {
  BinaryControlImplementationProps,
  BinaryControlProps,
} from "@/components/types";

export type SwitchProps = BinaryControlProps;
export type SwitchImplementationProps = BinaryControlImplementationProps;

export type SwitchIndicatorProps = Pick<SwitchProps, "value"> & {
  disabled: boolean;
};
