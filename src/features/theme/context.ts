import { createContext } from "react";

import type { Theme } from "./types";

export default createContext<Theme | undefined>(undefined);
