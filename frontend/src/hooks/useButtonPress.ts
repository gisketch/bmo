import { useState, useEffect, useCallback } from 'react';
import { playButtonSfx } from '../sfx';

interface UseButtonPressOptions {
  /** Keyboard keys that trigger press (default: none) */
  keys?: string[];
  playSfx?: boolean;
}

/**
 * Reusable hook for 3D-extruded button press state.
 * Handles mouse, touch, and keyboard press/release.
 *
 * Returns:
 *  - pressed: boolean
 *  - pressProps: spread onto the clickable container element
 */
export function useButtonPress(options: UseButtonPressOptions = {}) {
  const { keys = [], playSfx = true } = options;
  const [pressed, setPressed] = useState(false);
  const lastTouchAtMs = useState(() => ({ value: 0 }))[0];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (keys.includes(e.key)) setPressed(true);
    },
    [keys],
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (keys.includes(e.key)) setPressed(false);
    },
    [keys],
  );

  useEffect(() => {
    if (keys.length === 0) return;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keys, handleKeyDown, handleKeyUp]);

  const pressProps = {
    onMouseDown: (e?: { stopPropagation?: () => void }) => {
      if (Date.now() - lastTouchAtMs.value < 750) return;
      e?.stopPropagation?.();
      setPressed(true);
      if (playSfx) playButtonSfx();
    },
    onMouseUp: (e?: { stopPropagation?: () => void }) => {
      if (Date.now() - lastTouchAtMs.value < 750) return;
      e?.stopPropagation?.();
      setPressed(false);
    },
    onMouseLeave: () => setPressed(false),
    onTouchStart: (e?: { stopPropagation?: () => void }) => {
      lastTouchAtMs.value = Date.now();
      e?.stopPropagation?.();
      setPressed(true);
      if (playSfx) playButtonSfx();
    },
    onTouchEnd: (e?: { stopPropagation?: () => void }) => {
      lastTouchAtMs.value = Date.now();
      e?.stopPropagation?.();
      setPressed(false);
    },
  };

  return { pressed, pressProps } as const;
}
