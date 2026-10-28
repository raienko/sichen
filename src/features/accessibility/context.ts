import { createContext } from "react";

import type { Accessibility } from "./types";

export default createContext<Accessibility | undefined>(undefined);
