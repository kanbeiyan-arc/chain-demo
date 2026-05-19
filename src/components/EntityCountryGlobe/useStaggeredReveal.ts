import { useEffect, useState } from 'react';

export interface StaggeredRevealOptions {
  /** Hold the current count instead of advancing. */
  paused?: boolean;
  /** Delay before the FIRST item surfaces (lets the container settle). */
  firstDelayMs?: number;
  /** Delay between each subsequent item. */
  stepMs?: number;
}

/**
 * Reveals `total` items one-by-one and keeps them shown. The count resets to
 * 0 whenever `resetKey` changes (e.g. the focused entity), so each context
 * gets a fresh "emerge" sequence. Frozen while `paused`.
 *
 * Returns how many items should currently be visible (0…total).
 */
export function useStaggeredReveal(
  total: number,
  resetKey: unknown,
  { paused = false, firstDelayMs = 800, stepMs = 2000 }: StaggeredRevealOptions = {},
): number {
  const [revealed, setRevealed] = useState(0);

  // Start from nothing whenever the context changes.
  useEffect(() => {
    setRevealed(0);
  }, [resetKey]);

  useEffect(() => {
    if (paused || total === 0 || revealed >= total) return;
    const delay = revealed === 0 ? firstDelayMs : stepMs;
    const t = setTimeout(
      () => setRevealed((n) => Math.min(n + 1, total)),
      delay,
    );
    return () => clearTimeout(t);
  }, [paused, total, revealed, resetKey, firstDelayMs, stepMs]);

  return revealed;
}
