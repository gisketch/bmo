import type { ReactNode } from 'react';
import { playTapBodySfx } from '../../sfx';

interface BodyProps {
  children: ReactNode;
}

/**
 * Body — Full-screen teal background that fills the viewport.
 * Mobile-first: flex column, items centered.
 */
export default function Body({ children }: BodyProps) {
  return (
    <div
      className="flex select-none flex-col items-center justify-start w-full min-h-dvh min-h-svh px-6"
      style={{ backgroundColor: '#3FD4B6' }}
      onMouseDown={() => playTapBodySfx()}
      onTouchStart={() => playTapBodySfx()}
    >
      <div
        className="w-full flex flex-1 min-h-0 flex-col items-center justify-start gap-8"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {children}
      </div>
    </div>
  );
}
