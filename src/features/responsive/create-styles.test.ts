import { renderHook } from "@/root/testing";

import createStyles, { webDirection } from "./create-styles";

describe(`${createStyles.name} smoke test`, () => {
  it("passes units, breakpoint, isRTL, spacing, radius, and sizes through to the factory", async () => {
    const factory = jest.fn(
      ({ units, breakpoint, isRTL, spacing, radius, sizes }) => ({
        text: { fontSize: units(14) },
        breakpoint,
        isRTL,
        gap: spacing.x8,
        radius: radius.control,
        elementHeightMd: sizes.elementHeightMd,
      }),
    );
    const useStyles = createStyles(factory);

    const { result } = await renderHook(() => useStyles());

    expect(factory).toHaveBeenCalledWith(
      expect.objectContaining({
        units: expect.any(Function),
        breakpoint: expect.any(String),
        isRTL: expect.any(Boolean),
        spacing: expect.objectContaining({ x8: expect.any(Number) }),
        radius: expect.objectContaining({ control: expect.any(Number) }),
        sizes: expect.objectContaining({ elementHeightMd: expect.any(Number) }),
      }),
    );
    expect(typeof result.current.text.fontSize).toBe("number");
    expect(typeof result.current.gap).toBe("number");
    expect(typeof result.current.radius).toBe("number");
    expect(typeof result.current.elementHeightMd).toBe("number");
  });

  it("memoizes the result across re-renders with unchanged dimensions", async () => {
    const factory = jest.fn(({ units }) => ({ text: { fontSize: units(14) } }));
    const useStyles = createStyles(factory);

    const { result, rerender } = await renderHook(() => useStyles());
    const first = result.current;

    await rerender({});
    const second = result.current;

    expect(second).toBe(first);
    expect(factory).toHaveBeenCalledTimes(1);
  });
});

describe(`${createStyles.name} direction`, () => {
  it("passes the locale's direction to the factory", async () => {
    const factory = jest.fn(({ direction }) => ({ row: { direction } }));
    const useStyles = createStyles(factory);

    const { result } = await renderHook(() => useStyles());

    expect(factory).toHaveBeenCalledWith(
      expect.objectContaining({ direction: "ltr", isRTL: false }),
    );
    expect(result.current.row.direction).toBe("ltr");
  });

  it("keeps `direction` on native and renames it to `writingDirection` on web", () => {
    const styles = {
      layer: { direction: "ltr" as const, flex: 1 },
      row: { gap: 4 },
    };

    expect(webDirection(styles, false)).toBe(styles);
    expect(webDirection(styles, true)).toEqual({
      layer: { writingDirection: "ltr", flex: 1 },
      row: { gap: 4 },
    });
  });
});
