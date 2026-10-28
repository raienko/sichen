[Docs](../../../docs/index.md) › [Features](../../../docs/features/index.md) › App services

# Forms

> react-hook-form wired to zod schemas and the kit's `Input`.

<sub>`src/features/forms` · Tests: [`index.test.tsx`](index.test.tsx)</sub>

```tsx
import { FormInput, useAppForm } from "@/features/forms";
import { rules, z } from "@/features/validation";

const schema = z.object({ email: rules.email(), password: rules.password() });

function SignIn() {
  const form = useAppForm(schema, {
    defaultValues: { email: "", password: "" },
  });
  const submit = form.handleSubmit((values) =>
    api.post("/sign-in", values, { skipLog: true }),
  );

  return (
    <>
      <FormInput
        control={form.control}
        name="email"
        type="email"
        label="Email"
        required
      />
      <FormInput
        control={form.control}
        name="password"
        type="password"
        label="Password"
        required
      />
      <Button
        value="Sign in"
        onPress={submit}
        loading={form.formState.isSubmitting}
      />
    </>
  );
}
```

- **react-hook-form + zod, not Formik.** Formik is barely maintained and re-renders the whole form on every keystroke. react-hook-form keeps each field to itself, and one zod schema gives both the validation and the submitted values' type.
- **`useAppForm(schema, options)`** is `useForm` with the app's defaults:
  - validated by the schema;
  - `mode: "onTouched"`: a field is checked when it's left, then re-checked as it's corrected, so nobody gets an error while still typing;
  - the first invalid field is focused on a failed submit.

  `handleSubmit` receives the schema's _output_, with trimmed values.

- **`<FormInput control name … />`** is an `Input` bound to one field. It takes every Input prop (`type`, `label`, `options`, `helperText`, `required`, …) except `value`, `onChange`, `onBlur` and `error`, which come from the form. The error is translated through `errorText`.
- Picked variations (`select`, `datetime`, `color`) work the same way. They just can't be focused, having no text field.

---

[All features](../../../docs/features/index.md) · [Docs index](../../../docs/index.md)
