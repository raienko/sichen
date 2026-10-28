import { createContext } from "react";

import type { Locale } from "./types";

export default createContext<Locale | undefined>(undefined);
