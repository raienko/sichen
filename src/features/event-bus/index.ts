/**
 * A typed pub/sub bus — `emit`/`on` are checked against an events map, so a
 * payload's shape can't drift from its event name at any call site.
 *
 * Delivery is synchronous and in subscription order, and follows Node's
 * `EventEmitter` rules for listeners that change mid-emit: the listener list
 * is snapshotted when `emit` starts, so one subscribed or unsubscribed by
 * another listener takes effect from the *next* emit. Subscribing the same
 * function twice delivers twice, and each unsubscribe removes one.
 *
 * Generic and standalone on purpose — anything needing "fire an event here,
 * react to it somewhere else with no direct reference between the two" can
 * create its own bus instead of writing this plumbing again. Modal
 * (src/components/modal/event-bus.ts) is the first consumer: showing/hiding
 * a modal by `id` from anywhere without threading a ref through props.
 */
export type EventMap = Record<string, unknown>;

export type EventBus<Events extends EventMap> = {
  emit<K extends keyof Events & string>(event: K, payload: Events[K]): void;
  /** Returns an unsubscribe function. */
  on<K extends keyof Events & string>(
    event: K,
    listener: (payload: Events[K]) => void,
  ): () => void;
};

export function createEventBus<Events extends EventMap>(): EventBus<Events> {
  const listeners = new Map<string, ((payload: never) => void)[]>();

  return {
    emit(event, payload) {
      const current = listeners.get(event);
      if (!current) return;
      for (const listener of [...current]) listener(payload as never);
    },
    on(event, listener) {
      const current = listeners.get(event) ?? [];
      listeners.set(event, [...current, listener]);

      let subscribed = true;
      return () => {
        if (!subscribed) return;
        subscribed = false;
        const remaining = [...(listeners.get(event) ?? [])];
        remaining.splice(remaining.lastIndexOf(listener), 1);
        if (remaining.length > 0) listeners.set(event, remaining);
        else listeners.delete(event);
      };
    },
  };
}
