import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useForm,
  type Control,
  type FieldValues,
  type Path,
  type Resolver,
  type UseFormProps,
} from "react-hook-form";
import type { z } from "zod";

import Input, { type InputProps } from "@/components/input";
import { useLocale } from "@/features/localization";
import { errorText } from "@/features/validation";

/**
 * `useForm` with the app's defaults: validated by a zod schema (usually
 * built from `rules` in @/features/validation), checked when a field is
 * left and re-checked as it's corrected, and the first invalid field
 * focused on a failed submit.
 *
 * @example
 * const form = useAppForm(schema, { defaultValues: { email: "", password: "" } });
 * const submit = form.handleSubmit((values) => api.post("/sign-in", values));
 */
export function useAppForm<Schema extends z.ZodType<FieldValues, FieldValues>>(
  schema: Schema,
  options: Omit<
    UseFormProps<z.input<Schema>, unknown, z.output<Schema>>,
    "resolver"
  > = {},
) {
  return useForm<z.input<Schema>, unknown, z.output<Schema>>({
    // Not on every keystroke from the start, which shouts at someone still
    // typing; once a field has been left, it re-checks as they fix it.
    mode: "onTouched",
    shouldFocusError: true,
    ...options,
    // zodResolver's overloads can't see through a generic schema, so its
    // return type is restated as what it is: input → output of `schema`.
    resolver: zodResolver(schema) as unknown as Resolver<
      z.input<Schema>,
      unknown,
      z.output<Schema>
    >,
  });
}

/** Input's props minus what the form supplies, kept per `type`. */
type FieldProps = InputProps extends infer Props
  ? Props extends unknown
    ? Omit<Props, "value" | "onChange" | "onBlur" | "error">
    : never
  : never;

type Props<Values extends FieldValues> = FieldProps & {
  control: Control<Values>;
  name: Path<Values>;
};

/**
 * An `Input` bound to one form field: its value, its changes, when it was
 * left, and its error, translated into the active language. Takes every
 * Input prop (`type`, `label`, `options`, …) except those four.
 *
 * @example
 * <FormInput control={form.control} name="email" type="email" label="Email" required />
 */
export function FormInput<Values extends FieldValues>({
  control,
  name,
  ...props
}: Props<Values>) {
  const { t } = useLocale();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        // The ref lets `shouldFocusError` move focus here when this is the
        // first field that's wrong; picked variations (select, date) have
        // no text field and simply aren't focused.
        <Input
          ref={field.ref}
          {...({
            ...props,
            value: field.value,
            onChange: field.onChange,
            onBlur: field.onBlur,
            error: errorText(fieldState.error?.message, t),
          } as unknown as InputProps)}
        />
      )}
    />
  );
}
