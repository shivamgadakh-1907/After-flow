import { useRef, useCallback } from 'react';
import type { MouseEvent } from 'react';

/**
 * useNeonBorder — per-element mouse-tracking neon border hook.
 *
 * Returns a ref and event-handler props to spread onto any card element.
 * Each element independently tracks cursor position; no shared state means
 * sibling cards are completely unaffected.
 *
 * Usage:
 *   const neon = useNeonBorder();
 *   <div ref={neon.ref} {...neon.handlers} className="card neon-card-wrapper">
 *
 * The element must also carry the CSS class "neon-card-wrapper" so that the
 * ::before pseudo-element neon gradient is rendered (see index.css).
 */
export function useNeonBorder<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  const onMouseMove = useCallback((e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty('--neon-x', `${x}%`);
    el.style.setProperty('--neon-y', `${y}%`);
  }, []);

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (el) {
      el.style.setProperty('--neon-x', '-200%');
      el.style.setProperty('--neon-y', '-200%');
    }
  }, []);

  return {
    ref,
    handlers: { onMouseMove, onMouseLeave } as {
      onMouseMove: (e: MouseEvent) => void;
      onMouseLeave: () => void;
    },
  };
}
