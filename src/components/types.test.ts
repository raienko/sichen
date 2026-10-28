import {
  DEFAULT_COMPONENT_TYPE,
  type ComponentType,
  type ComponentTypeProps,
} from "./types";

describe("component implementation type", () => {
  it("defaults dual-implementation components to custom", () => {
    const supported: ComponentType[] = ["custom", "expo"];
    const props: ComponentTypeProps = {};

    expect(supported).toContain(DEFAULT_COMPONENT_TYPE);
    expect(props.type ?? DEFAULT_COMPONENT_TYPE).toBe("custom");
  });
});
