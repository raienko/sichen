import { createContext } from "react";

import type { GridMetrics } from "@/features/responsive";

/**
 * The row's resolved grid arithmetic, shared with its cells. It's the
 * `GridMetrics` from `useGridMetrics` as-is rather than a shape of its own —
 * a cell needs exactly what that hook already computes.
 */
export default createContext<GridMetrics | undefined>(undefined);
