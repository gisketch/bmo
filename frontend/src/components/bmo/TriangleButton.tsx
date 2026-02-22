import { useButtonPress } from '../../hooks/useButtonPress';

/**
 * TriangleButton — A rounded triangular button with 3D extrusion and sharp shadow.
 * Points upward by default, rotatable via prop.
 */
interface TriangleButtonProps {
  /** Rotation in degrees (default: 0 = pointing up) */
  rotation?: number;
  color?: string;
}

export default function TriangleButton({
  rotation = 0,
  color = '#3E9BF9',
}: TriangleButtonProps) {
  const extrudeOffset = 5;
  const shadowOffset = 4;
  const sharpShadowColor = 'rgba(13, 81, 66, 0.5)';

  // Derive darker versions for extrusion
  const extrudeColor = darken(color, 0.3);

  const { pressed, pressProps } = useButtonPress();

  const pressY = pressed ? extrudeOffset : 0;
  const shadowY = pressed ? 0 : extrudeOffset + shadowOffset;

  // Triangle dimensions — slightly larger than DPad arm (48+8 = 56px base, 48+8 = 56px tall)
  const size = 56;
  const container = size + 8; // padding for rounded corners

  // SVG triangle with rounded corners via polygon + stroke-linejoin
  const triangle = (fill: string) => (
    <svg
      width={container}
      height={container}
      viewBox={`0 0 ${container} ${container}`}
      className="pointer-events-none"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <polygon
        points={`${container / 2},6 ${container - 6},${container - 6} 6,${container - 6}`}
        fill={fill}
        stroke={fill}
        strokeWidth="8"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div
      className="relative cursor-pointer select-none"
      style={{ width: container, height: container + extrudeOffset + shadowOffset }}
      {...pressProps}
    >
      {/* Sharp shadow */}
      <div
        className="absolute pointer-events-none transition-all duration-75 ease-out"
        style={{ top: shadowY, opacity: pressed ? 0 : 1 }}
      >
        {triangle(sharpShadowColor)}
      </div>

      {/* Extrusion */}
      <div
        className="absolute pointer-events-none"
        style={{ top: extrudeOffset }}
      >
        {triangle(extrudeColor)}
      </div>

      {/* Main button */}
      <div
        className="relative pointer-events-none transition-transform duration-75 ease-out"
        style={{ transform: `translateY(${pressY}px)` }}
      >
        {triangle(color)}
      </div>
    </div>
  );
}

/** Darken a hex color by a factor (0-1) */
function darken(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `#${Math.round(r * (1 - factor)).toString(16).padStart(2, '0')}${Math.round(g * (1 - factor)).toString(16).padStart(2, '0')}${Math.round(b * (1 - factor)).toString(16).padStart(2, '0')}`;
}
