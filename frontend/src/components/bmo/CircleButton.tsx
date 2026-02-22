import type { ReactNode } from 'react';
import { useButtonPress } from '../../hooks/useButtonPress';

interface CircleButtonProps {
  /** Diameter in pixels */
  size: number;
  color: string;
  /** Optional click handler */
  onClick?: () => void;
  /** Optional children (icon overlay) */
  children?: ReactNode;
}

/**
 * CircleButton — A circular button with 3D extrusion and sharp shadow.
 * Reuses the same press/extrusion/shadow pattern as DPad.
 */
export default function CircleButton({ size, color, onClick, children }: CircleButtonProps) {
  const extrudeOffset = 5;
  const shadowOffset = 4;
  const sharpShadowColor = 'rgba(13, 81, 66, 0.5)';
  const extrudeColor = darken(color, 0.3);

  const { pressed, pressProps } = useButtonPress();

  const pressY = pressed ? extrudeOffset : 0;
  const shadowY = pressed ? 0 : extrudeOffset + shadowOffset;

  return (
    <div
      className="relative cursor-pointer select-none"
      style={{ width: size, height: size + extrudeOffset + shadowOffset }}
      {...pressProps}
      onClick={onClick}
    >
      {/* Sharp shadow */}
      <div
        className="absolute rounded-full pointer-events-none transition-all duration-75 ease-out"
        style={{
          width: size,
          height: size,
          top: shadowY,
          backgroundColor: sharpShadowColor,
          opacity: pressed ? 0 : 1,
        }}
      />
      {/* Extrusion */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size,
          height: size,
          top: extrudeOffset,
          backgroundColor: extrudeColor,
        }}
      />
      {/* Main button */}
      <div
        className="absolute rounded-full pointer-events-none transition-transform duration-75 ease-out"
        style={{
          width: size,
          height: size,
          transform: `translateY(${pressY}px)`,
          backgroundColor: color,
        }}
      >
        {children && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

function darken(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `#${Math.round(r * (1 - factor)).toString(16).padStart(2, '0')}${Math.round(g * (1 - factor)).toString(16).padStart(2, '0')}${Math.round(b * (1 - factor)).toString(16).padStart(2, '0')}`;
}
