// Typesafe, higher-order debounce function for void-returning functions

export function debounce<A extends unknown[]>(fn: VoidFn<A>, delay: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function (...args: A): void {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn(...args);
    }, delay);
  } satisfies VoidFn<A>;
}

type VoidFn<A extends unknown[]> = (...args: A) => void;
