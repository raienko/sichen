import type { DeepLinkRoute } from "./types";

/**
 * Every link the app handles specially, in one place — the table to add to
 * when a new link needs to do something the file-based router can't do on
 * its own.
 *
 * Order is priority: the first pattern that matches wins, so put the
 * specific ones above the wildcards.
 *
 * A path that *isn't* listed here still works. Expo Router routes it by
 * file the way it always did (`/settings` opens `src/app/settings.tsx`),
 * which is why this table stays short — it's for the links that need a
 * handler, not for every route in the app.
 *
 * @example
 * const routes: DeepLinkRoute[] = [
 *   // Rewrite an incoming path onto a real route.
 *   {
 *     pattern: "/orders/:id",
 *     handle: ({ params }) => ({
 *       pathname: "/orders/[id]",
 *       params: { id: params.id },
 *     }),
 *   },
 *   // Do something other than navigate.
 *   {
 *     pattern: "/promo/:code",
 *     handle: ({ params }) => Modal.show(`promo-${params.code}`),
 *   },
 *   // Wait for the app to open the "auth" gate before running at all.
 *   {
 *     pattern: "/account",
 *     gates: ["auth"],
 *     handle: () => "/account",
 *   },
 * ];
 */
const routes: DeepLinkRoute[] = [];

export default routes;
