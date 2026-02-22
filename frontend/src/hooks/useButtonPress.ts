import { useState, useEffect, useCallback } from 'react';

interface UseButtonPressOptions {
  /** Keyboard keys that trigger press (default: none) */
  keys?: string[];
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
  const { keys = [] } = options;
  const [pressed, setPressed] = useState(false);

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
    onMouseDown: () => setPressed(true),
    onMouseUp: () => setPressed(false),
    onMouseLeave: () => setPressed(false),
    onTouchStart: () => setPressed(true),
    onTouchEnd: () => setPressed(false),
  };

  return { pressed, pressProps } as const;
}
