import { useButtonPress } from '../../hooks/useButtonPress';

const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

/**
 * DPad — A yellow directional pad with 3D extrusion effect and sharp shadow.
 * Arms connect seamlessly to the center (no inner radius), outer edges rounded.
 * Press via click, touch, or arrow keys animates the pad down and hides the shadow.
 */
export default function DPad() {
  const color = '#FFE249';
  const shadowColor = '#C4AA1A';
  const sharpShadowColor = 'rgba(13, 81, 66, 0.5)';
  const extrudeOffset = 5; // px
  const shadowOffset = 4; // px — flat sharp shadow below extrusion

  const { pressed, pressProps } = useButtonPress({ keys: ARROW_KEYS });

  // Dimensions — all arms are equal length
  const armWidth = 40;
  const armLength = 48;
  const totalW = armLength + armWidth + armLength;
  const totalH = armLength + armWidth + armLength;

  const pressY = pressed ? extrudeOffset : 0;
  const shadowY = pressed ? 0 : extrudeOffset + shadowOffset;

  // Shared arm styles for the cross shape
  const arms = (bg: string) => (
    <>
      {/* Up */}
      <div
        className="absolute rounded-t-lg"
        style={{
          backgroundColor: bg,
          width: armWidth,
          height: armLength,
          left: armLength,
          top: 0,
        }}
      />
      {/* Down */}
      <div
        className="absolute rounded-b-lg"
        style={{
          backgroundColor: bg,
          width: armWidth,
          height: armLength,
          left: armLength,
          bottom: 0,
        }}
      />
      {/* Left */}
      <div
        className="absolute rounded-l-lg"
        style={{
          backgroundColor: bg,
          width: armLength,
          height: armWidth,
          left: 0,
          top: armLength,
        }}
      />
      {/* Right */}
      <div
        className="absolute rounded-r-lg"
        style={{
          backgroundColor: bg,
          width: armLength,
          height: armWidth,
          right: 0,
          top: armLength,
        }}
      />
      {/* Center */}
      <div
        className="absolute"
        style={{
          backgroundColor: bg,
          width: armWidth,
          height: armWidth,
          left: armLength,
          top: armLength,
        }}
      />
    </>
  );

  return (
    <div
      className="relative cursor-pointer select-none"
      style={{ width: totalW, height: totalH + extrudeOffset + shadowOffset }}
      {...pressProps}
    >
      {/* Sharp shadow layer — sits below everything, disappears on press */}
      <div
        className="absolute pointer-events-none transition-all duration-75 ease-out"
        style={{ top: shadowY, width: totalW, height: totalH, opacity: pressed ? 0 : 1 }}
      >
        {arms(sharpShadowColor)}
      </div>

      {/* Extrusion layer — stays fixed */}
      <div
        className="absolute pointer-events-none"
        style={{ top: extrudeOffset, width: totalW, height: totalH }}
      >
        {arms(shadowColor)}
      </div>

      {/* Main DPad layer — moves down when pressed */}
      <div
        className="relative transition-transform duration-75 ease-out pointer-events-none"
        style={{
          width: totalW,
          height: totalH,
          transform: `translateY(${pressY}px)`,
        }}
      >
        {arms(color)}
      </div>
    </div>
  );
}
