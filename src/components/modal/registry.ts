import logger from "@/features/logger";

/**
 * Tracks which `<Modal id="..." />` instances are currently mounted, purely
 * for dev-time warnings. `Modal.show(id)`/`Modal.hide(id)` don't need this
 * to *work* — they just emit on the event bus, and a broadcast with no
 * listener is already a harmless no-op — but that also means a typo'd or
 * stale id, or two instances accidentally sharing one id, would otherwise
 * fail completely silently. The shared logger keeps these warnings styled
 * and strips them from production output.
 */
const mountedIds = new Map<string, number>();

/** Call on mount; call the returned function on unmount. */
export function registerModalId(id: string): () => void {
  const count = mountedIds.get(id) ?? 0;

  if (count > 0) {
    logger.warn(
      `Modal: more than one <Modal id="${id}" /> is mounted at once — ` +
        `Modal.show("${id}")/Modal.hide("${id}") (and a ref on either) will affect both together.`,
    );
  }

  mountedIds.set(id, count + 1);

  return () => {
    const current = mountedIds.get(id) ?? 0;
    if (current <= 1) {
      mountedIds.delete(id);
    } else {
      mountedIds.set(id, current - 1);
    }
  };
}

export function warnIfModalIdNotMounted(action: "show" | "hide", id: string) {
  if (!mountedIds.has(id)) {
    logger.warn(
      `Modal.${action}("${id}"): no <Modal id="${id}" /> is currently mounted — this call did nothing.`,
    );
  }
}
