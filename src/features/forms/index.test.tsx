import { Pressable, Text } from "react-native";

import { fireEvent, render, screen, waitFor } from "@/root/testing";
import { matches, rules, z } from "@/features/validation";

import { FormInput, useAppForm } from "./index";

const schema = matches(
  z.object({
    email: rules.email(),
    password: rules.password(),
    confirm: z.string(),
  }),
  "password",
  "confirm",
);

function SignUp({ onSubmit }: { onSubmit: (values: unknown) => void }) {
  const form = useAppForm(schema, {
    defaultValues: { email: "", password: "", confirm: "" },
  });
  return (
    <>
      <FormInput
        control={form.control}
        name="email"
        type="email"
        label="Email"
      />
      <FormInput
        control={form.control}
        name="password"
        type="password"
        label="Password"
      />
      <FormInput
        control={form.control}
        name="confirm"
        type="password"
        label="Confirm"
      />
      <Pressable onPress={form.handleSubmit(onSubmit)}>
        <Text>Submit</Text>
      </Pressable>
    </>
  );
}

describe("forms", () => {
  it("shows each rule's message, translated, and doesn't submit", async () => {
    const onSubmit = jest.fn();
    await render(<SignUp onSubmit={onSubmit} />);

    await fireEvent.changeText(screen.getByLabelText("Email"), "ada@");
    await fireEvent.changeText(screen.getByLabelText("Password"), "short");
    await fireEvent.press(screen.getByText("Submit"));

    await waitFor(() => {
      expect(screen.getByText("Enter a valid email")).toBeTruthy();
    });
    expect(screen.getByText("At least 8 characters")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("reports a mismatch on the confirming field", async () => {
    await render(<SignUp onSubmit={jest.fn()} />);

    await fireEvent.changeText(
      screen.getByLabelText("Email"),
      "ada@example.com",
    );
    await fireEvent.changeText(screen.getByLabelText("Password"), "abcd1234");
    await fireEvent.changeText(screen.getByLabelText("Confirm"), "abcd12345");
    await fireEvent.press(screen.getByText("Submit"));

    await waitFor(() => {
      expect(screen.getByText("Doesn't match")).toBeTruthy();
    });
  });

  it("submits the parsed values, trimmed", async () => {
    const onSubmit = jest.fn();
    await render(<SignUp onSubmit={onSubmit} />);

    await fireEvent.changeText(
      screen.getByLabelText("Email"),
      "  ada@example.com ",
    );
    await fireEvent.changeText(screen.getByLabelText("Password"), "abcd1234");
    await fireEvent.changeText(screen.getByLabelText("Confirm"), "abcd1234");
    await fireEvent.press(screen.getByText("Submit"));

    await waitFor(() => {
      expect(onSubmit.mock.calls[0]?.[0]).toEqual({
        email: "ada@example.com",
        password: "abcd1234",
        confirm: "abcd1234",
      });
    });
  });
});
