/**
 * `GET /api/health` — the app's own server answering. Runs on the server
 * (the Expo dev server in development, the hosting runtime in production),
 * never in the app bundle, so it can read server-only env vars and secrets.
 *
 * Says it's up and nothing else: a version or build in a public response
 * tells an attacker which known bugs to try.
 *
 * @example
 * curl http://localhost:8081/api/health
 * // { "status": "ok" }
 */
export function GET() {
  return Response.json({ status: "ok" });
}
