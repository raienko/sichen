/**
 * Ctrl+Shift+D (⌘+Shift+D on a Mac) opens the menu — the web has no shake
 * and no Expo dev menu to hang an item on.
 */
export function registerTrigger(open: () => void): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (
      (event.ctrlKey || event.metaKey) &&
      event.shiftKey &&
      event.key.toLowerCase() === "d"
    ) {
      event.preventDefault();
      open();
    }
  };
  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}

export function reload(): void {
  window.location.reload();
}
