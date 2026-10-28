import { fireEvent, render, screen, waitFor } from "@/root/testing";

import Component from "./index";

describe(`${Component.displayName} smoke test`, () => {
  it("defaults to the text variation when type is omitted", async () => {
    const onChange = jest.fn();
    await render(<Component value="" onChange={onChange} placeholder="Type" />);

    await fireEvent.changeText(screen.getByPlaceholderText("Type"), "hello");

    expect(onChange).toHaveBeenCalledWith("hello");
  });

  it("routes to the numeric variation when type='numeric'", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        type="numeric"
        value={null}
        onChange={onChange}
        placeholder="Age"
      />,
    );

    await fireEvent.changeText(screen.getByPlaceholderText("Age"), "12abc");

    expect(onChange).toHaveBeenCalledWith(12);
  });

  it("routes to the email variation when type='email'", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        type="email"
        value=""
        onChange={onChange}
        placeholder="Email"
      />,
    );

    await fireEvent.changeText(
      screen.getByPlaceholderText("Email"),
      "ada@example.com",
    );

    expect(onChange).toHaveBeenCalledWith("ada@example.com");
    expect(screen.getByPlaceholderText("Email").props.keyboardType).toBe(
      "email-address",
    );
  });

  it("routes to the file variation when type='file'", async () => {
    await render(
      <Component
        type="file"
        label="Attachment"
        placeholder="Choose a file"
        value={null}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByText("Choose a file")).toBeTruthy();
  });

  it("routes to the select variation when type='select'", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        type="select"
        label="Country"
        value={null}
        onChange={onChange}
        options={[
          { value: "uk", label: "United Kingdom" },
          { value: "jp", label: "Japan" },
        ]}
      />,
    );

    await fireEvent.press(screen.getByLabelText("Country"));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Japan" })).toBeTruthy();
    });
    await fireEvent.press(screen.getByRole("button", { name: "Japan" }));

    expect(onChange).toHaveBeenCalledWith("jp");
  });

  it("routes to the datetime variation when type='datetime'", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        type="datetime"
        mode="date"
        label="Starts"
        value={new Date(2026, 7, 27)}
        onChange={onChange}
      />,
    );

    await fireEvent.press(screen.getByLabelText("Starts"));
    await waitFor(() => {
      expect(screen.getByTestId("calendar")).toBeTruthy();
    });
    await fireEvent.press(screen.getByRole("button", { name: "Done" }));

    expect(onChange).toHaveBeenCalledWith(new Date(2026, 7, 27));
  });

  it("routes to the password variation when type='password'", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        type="password"
        label="Password"
        value=""
        onChange={onChange}
      />,
    );

    const field = screen.getByLabelText("Password");
    expect(field.props.secureTextEntry).toBe(true);

    await fireEvent.changeText(field, "hunter2");

    expect(onChange).toHaveBeenCalledWith("hunter2");
  });

  it("routes to the code variation when type='code'", async () => {
    const onChange = jest.fn();
    await render(
      <Component type="code" label="Code" value="" onChange={onChange} />,
    );

    await fireEvent.changeText(screen.getByLabelText("Code"), "1a2b3c");

    expect(onChange).toHaveBeenCalledWith("123");
  });

  it("routes to the checklist variation when type='checklist'", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        type="checklist"
        label="Interests"
        value={[]}
        onChange={onChange}
        options={[{ value: "design", label: "Design" }]}
      />,
    );

    await fireEvent.press(screen.getByRole("checkbox", { name: "Design" }));

    expect(onChange).toHaveBeenCalledWith(["design"]);
  });

  it("routes to the switch-group variation when type='switchGroup'", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        type="switchGroup"
        label="Notifications"
        value={[]}
        onChange={onChange}
        options={[{ value: "product", label: "Product updates" }]}
      />,
    );

    await fireEvent.press(
      screen.getByRole("switch", { name: "Product updates" }),
    );

    expect(onChange).toHaveBeenCalledWith(["product"]);
  });

  it("routes to the radio-group variation when type='radioGroup'", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        type="radioGroup"
        label="Plan"
        value={null}
        onChange={onChange}
        options={[{ value: "pro", label: "Pro" }]}
      />,
    );

    await fireEvent.press(screen.getByRole("radio", { name: "Pro" }));

    expect(onChange).toHaveBeenCalledWith("pro");
  });

  it("routes to the range variation when type='range'", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        type="range"
        label="Budget"
        value={[20, 80]}
        onChange={onChange}
        min={0}
        max={100}
        step={10}
        thumbLabels={["Minimum budget", "Maximum budget"]}
      />,
    );

    await fireEvent(
      screen.getByRole("slider", { name: "Minimum budget" }),
      "accessibilityAction",
      { nativeEvent: { actionName: "increment" } },
    );

    expect(onChange).toHaveBeenCalledWith([30, 80]);
  });

  it("routes to the phone variation when type='phone'", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        type="phone"
        label="Phone"
        defaultCountry="US"
        value={null}
        onChange={onChange}
      />,
    );

    await fireEvent.changeText(screen.getByLabelText("Phone"), "2133734253");

    expect(onChange).toHaveBeenLastCalledWith("+12133734253");
  });
});
