import { useCallback, useRef } from 'react';

const COMBO_SEQUENCE = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'big-red'] as const;
const COMBO_TIMEOUT_MS = 3000;

type ComboInput = (typeof COMBO_SEQUENCE)[number];

export function useSecretCombo(onActivate: () => void) {
  const indexRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const resetCombo = useCallback(() => {
    indexRef.current = 0;
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const feedInput = useCallback(
    (input: ComboInput) => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);

      if (input === COMBO_SEQUENCE[indexRef.current]) {
        indexRef.current += 1;
        if (indexRef.current === COMBO_SEQUENCE.length) {
          resetCombo();
          onActivate();
          return;
        }
        timerRef.current = window.setTimeout(resetCombo, COMBO_TIMEOUT_MS);
      } else {
        resetCombo();
      }
    },
    [onActivate, resetCombo],
  );

  return { feedInput };
}
