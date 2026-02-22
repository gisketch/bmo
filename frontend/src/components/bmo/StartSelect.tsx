import { useButtonPress } from '../../hooks/useButtonPress';

/**
 * StartSelect — Two thin horizontal buttons side by side (Start and Select).
 * Uses the same 3D extrusion + sharp shadow pattern as DPad.
 */
export default function StartSelect() {
  const color = '#1156A3';
  const extrudeColor = '#0C3D75';
  const sharpShadowColor = 'rgba(13, 81, 66, 0.5)';
  const extrudeOffset = 4;
  const shadowOffset = 3;

  const startBtn = useButtonPress();
  const selectBtn = useButtonPress();

  const btnW = 56;
  const btnH = 14;
  const gap = 12;

  const button = (
    _label: string,
    { pressed, pressProps }: ReturnType<typeof useButtonPress>,
  ) => {
    const pressY = pressed ? extrudeOffset : 0;
    const shadowY = pressed ? 0 : extrudeOffset + shadowOffset;

    return (
      <div
        className="relative cursor-pointer select-none"
        style={{ width: btnW, height: btnH + extrudeOffset + shadowOffset }}
        {...pressProps}
      >
        {/* Sharp shadow */}
        <div
          className="absolute rounded-lg pointer-events-none transition-all duration-75 ease-out"
          style={{
            width: btnW,
            height: btnH,
            top: shadowY,
            backgroundColor: sharpShadowColor,
            opacity: pressed ? 0 : 1,
          }}
        />
        {/* Extrusion */}
        <div
          className="absolute rounded-lg pointer-events-none"
          style={{
            width: btnW,
            height: btnH,
            top: extrudeOffset,
            backgroundColor: extrudeColor,
          }}
        />
        {/* Main button */}
        <div
          className="absolute rounded-lg pointer-events-none transition-transform duration-75 ease-out"
          style={{
            width: btnW,
            height: btnH,
            transform: `translateY(${pressY}px)`,
            backgroundColor: color,
          }}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-row items-center" style={{ gap }}>
      {button('select', startBtn)}
      {button('start', selectBtn)}
    </div>
  );
}
