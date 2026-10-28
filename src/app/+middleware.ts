import { setResponseHeaders } from "expo-server";
import type { MiddlewareFunction } from "expo-router/server";

import { securityHeaders } from "@/features/security-headers";

/**
 * Runs on the server before every request — pages, assets and API routes —
 * and adds the security headers to whatever answers it. Needs the
 * `expo-router` plugin's `unstable_useServerMiddleware` (app.config.ts).
 */
const middleware: MiddlewareFunction = () => {
  setResponseHeaders(securityHeaders(process.env.NODE_ENV === "production"));
};

export default middleware;
