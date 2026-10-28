import { useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import Text from "@/components/text";
import { FormInput, useAppForm } from "@/features/forms";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { matches, rules, z } from "@/features/validation";

import Readout from "./readout";

const schema = matches(
  z.object({
    name: rules.name(),
    email: rules.email(),
    phone: rules.optional(rules.phone()),
    password: rules.password(),
    confirm: z.string(),
  }),
  "password",
  "confirm",
);

/**
 * A sign-up form end to end: one zod schema built from `rules`, errors in
 * the active language, checked once a field is left, and the first invalid
 * field focused on a failed submit.
 */
export default function FormsSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [submitted, setSubmitted] = useState<string | null>(null);

  const form = useAppForm(schema, {
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirm: "",
    },
  });

  const submit = form.handleSubmit((values) => {
    setSubmitted(
      JSON.stringify({ ...values, password: "•••", confirm: "•••" }),
    );
  });

  return (
    <View style={styles.container}>
      <Text
        value="A sign-up form: zod rules, errors in the current language, checked once a field is left, and the first invalid field focused when you submit."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />
      <FormInput control={form.control} name="name" label="Name" required />
      <FormInput
        control={form.control}
        name="email"
        type="email"
        label="Email"
        required
      />
      <FormInput
        control={form.control}
        name="phone"
        type="phone"
        defaultCountry="UA"
        label="Phone"
        helperText="Optional — checked only if you type one"
      />
      <FormInput
        control={form.control}
        name="password"
        type="password"
        label="Password"
        helperText="At least 8 characters, a letter and a digit"
        required
      />
      <FormInput
        control={form.control}
        name="confirm"
        type="password"
        label="Confirm password"
        required
      />
      <View style={styles.actions}>
        <Button
          value="reset"
          onPress={() => {
            form.reset();
            setSubmitted(null);
          }}
        />
        <Button value="sign up" type="primary" onPress={submit} />
      </View>
      <Readout label="submitted (trimmed)" value={submitted ?? "—"} />
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x12,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.x8,
  },
}));
