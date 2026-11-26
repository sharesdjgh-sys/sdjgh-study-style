/** Compose timeout and caller cancellation on Safari versions without AbortSignal.any. */
export function requestSignal(
  milliseconds: number,
  parent?: AbortSignal,
): AbortSignal {
  if (parent?.aborted) return parent;
  if (
    typeof AbortSignal.timeout === "function" &&
    (!parent || typeof AbortSignal.any === "function")
  ) {
    const timeout = AbortSignal.timeout(milliseconds);
    return parent ? AbortSignal.any([parent, timeout]) : timeout;
  }

  const controller = new AbortController();
  const cancel = () => {
    clearTimeout(timer);
    parent?.removeEventListener("abort", cancel);
    controller.abort();
  };
  const timer = setTimeout(cancel, milliseconds);
  parent?.addEventListener("abort", cancel, { once: true });
  return controller.signal;
}
