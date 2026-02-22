import type { ReactNode } from 'react';

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
      className="flex flex-col items-center justify-between w-full min-h-dvh"
      style={{ backgroundColor: '#3FD4B6' }}
    >
      {children}
    </div>
  );
}
