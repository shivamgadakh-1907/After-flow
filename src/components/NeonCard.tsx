import { useRef, useCallback } from 'react';
import type { CSSProperties, ReactNode, MouseEvent } from 'react';

interface NeonCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  id?: string;
  /** Extra class names forwarded to the inner .card div */
  cardClassName?: string;
}

/**
 * NeonCard — per-card mouse-tracking neon border effect.
 *
 * Each card independently tracks the cursor position and paints a
 * radial-gradient "neon spotlight" along the border only while hovered.
 * No shared state; sibling cards are completely unaffected.
 */
export default function NeonCard({
  children,
  className = '',
  style,
  onClick,
  id,
  cardClassName = '',
}: NeonCardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty('--neon-x', `${x}%`);
    el.style.setProperty('--neon-y', `${y}%`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Reset so the glow disappears cleanly
    const el = wrapperRef.current;
    if (!el) return;
    el.style.setProperty('--neon-x', '-200%');
    el.style.setProperty('--neon-y', '-200%');
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`neon-card-wrapper ${className}`}
      style={
        {
          '--neon-x': '-200%',
          '--neon-y': '-200%',
          ...style,
        } as CSSProperties
      }
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      id={id}
    >
      <div className={`card ${cardClassName}`}>{children}</div>
    </div>
  );
}
