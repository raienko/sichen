/**
 * The geometry the web chart needs and Victory computes for native: a
 * y-domain with round tick values, and where each x value lands. Pure and
 * separately tested, since an SVG's coordinates are not something a
 * component test can meaningfully read.
 */

/** A 1, 2, 2.5 or 5 × 10ⁿ step, whichever gives about `count` ticks. */
export function niceStep(span: number, count: number): number {
  if (!(span > 0) || count < 1) return 1;
  const raw = span / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const residual = raw / magnitude;
  const factor =
    residual <= 1
      ? 1
      : residual <= 2
        ? 2
        : residual <= 2.5
          ? 2.5
          : residual <= 5
            ? 5
            : 10;
  return factor * magnitude;
}

export type YScale = {
  /** Lowest and highest value the axis spans — tick-aligned. */
  min: number;
  max: number;
  ticks: number[];
};

/**
 * The y-axis for `values`, widened to round numbers at both ends.
 *
 * `includeZero` is for bars and areas, whose length or fill is measured
 * from the baseline: starting a bar axis at 18 makes 20 look twice 19.
 * Lines are read by their shape, so they get the data's own range.
 */
export function yScale(
  values: readonly number[],
  { includeZero, tickCount = 4 }: { includeZero: boolean; tickCount?: number },
): YScale {
  const finite = values.filter(Number.isFinite);
  let low = finite.length ? Math.min(...finite) : 0;
  let high = finite.length ? Math.max(...finite) : 1;
  if (includeZero) {
    low = Math.min(0, low);
    high = Math.max(0, high);
  }
  if (low === high) {
    // A flat series still needs a band to sit in rather than a zero span.
    const pad = low === 0 ? 1 : Math.abs(low) / 2;
    low = includeZero && low >= 0 ? low : low - pad;
    high = high + pad;
  }

  const step = niceStep(high - low, tickCount);
  const min = Math.floor(low / step) * step;
  const max = Math.ceil(high / step) * step;
  const ticks: number[] = [];
  // Rounded so 0.1 + 0.2 doesn't print as 0.30000000000000004.
  for (let tick = min; tick <= max + step / 2; tick += step) {
    ticks.push(Number(tick.toPrecision(12)));
  }
  return { min, max, ticks };
}

/**
 * Centre of each x value across `width`.
 *
 * Bars get a band each — the value sits in the middle of its slot, so the
 * first and last groups never hang off the plot. Points (line, area) run
 * edge to edge inside `inset`, the same padding Victory's `domainPadding`
 * gives native. One point sits in the middle either way.
 */
export function xPositions(
  count: number,
  width: number,
  { band, inset }: { band: boolean; inset: number },
): number[] {
  if (count <= 0) return [];
  if (band) {
    const slot = width / count;
    return Array.from({ length: count }, (_, index) => slot * (index + 0.5));
  }
  if (count === 1) return [width / 2];
  const span = Math.max(0, width - inset * 2);
  return Array.from(
    { length: count },
    (_, index) => inset + (span * index) / (count - 1),
  );
}

/**
 * Which x labels to draw so neighbours don't collide: every nth, where n
 * is the smallest step that leaves `minGap` px between label centres.
 * The first label always shows; the last shows when the step lands on it.
 */
export function labelStride(
  count: number,
  width: number,
  minGap: number,
): number {
  if (count <= 1 || minGap <= 0) return 1;
  const gap = width / count;
  return Math.max(1, Math.ceil(minGap / Math.max(gap, 1)));
}

/** An SVG path through `points`, starting a new segment at every gap. */
export function linePath(
  points: readonly ({ x: number; y: number } | null)[],
): string {
  let path = "";
  let drawing = false;
  for (const point of points) {
    if (!point) {
      drawing = false;
      continue;
    }
    path += `${drawing ? "L" : "M"}${round(point.x)},${round(point.y)}`;
    drawing = true;
  }
  return path;
}

/**
 * The fill under a line: each unbroken run of points closed down to
 * `baseline`, so a gap in the data is a gap in the fill too.
 */
export function areaPath(
  points: readonly ({ x: number; y: number } | null)[],
  baseline: number,
): string {
  const runs: { x: number; y: number }[][] = [[]];
  for (const point of points) {
    if (point) runs[runs.length - 1]!.push(point);
    else if (runs[runs.length - 1]!.length) runs.push([]);
  }
  return runs
    .filter((run) => run.length > 0)
    .map((run) => {
      const first = run[0]!;
      const last = run[run.length - 1]!;
      return `${linePath(run)}L${round(last.x)},${round(baseline)}L${round(first.x)},${round(baseline)}Z`;
    })
    .join("");
}

/**
 * A bar with only its top corners rounded — rounding all four detaches it
 * from the axis it is measured against. Negative bars hang down, so their
 * "top" is the end away from the baseline.
 */
export function barPath(
  x: number,
  width: number,
  valueY: number,
  baseline: number,
  radius: number,
): string {
  const top = Math.min(valueY, baseline);
  const bottom = Math.max(valueY, baseline);
  const height = bottom - top;
  const r = Math.max(0, Math.min(radius, width / 2, height));
  const right = x + width;
  if (r === 0) {
    return `M${round(x)},${round(top)}H${round(right)}V${round(bottom)}H${round(x)}Z`;
  }
  if (valueY <= baseline) {
    return `M${round(x)},${round(bottom)}V${round(top + r)}Q${round(x)},${round(top)} ${round(x + r)},${round(top)}H${round(right - r)}Q${round(right)},${round(top)} ${round(right)},${round(top + r)}V${round(bottom)}Z`;
  }
  return `M${round(x)},${round(top)}V${round(bottom - r)}Q${round(x)},${round(bottom)} ${round(x + r)},${round(bottom)}H${round(right - r)}Q${round(right)},${round(bottom)} ${round(right)},${round(bottom - r)}V${round(top)}Z`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
