import { useButtonPress } from '../../hooks/useButtonPress';
import { useCallback, useEffect, useRef } from 'react';

const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

interface DPadProps {
  onUpPress?: () => void;
  onDownPress?: () => void;
  onLeftPress?: () => void;
  onRightPress?: () => void;
}

/**
 * DPad — A yellow directional pad with 3D extrusion effect and sharp shadow.
 * Arms connect seamlessly to the center (no inner radius), outer edges rounded.
 * Press via click, touch, or arrow keys animates the pad down and hides the shadow.
 */
export default function DPad({ onUpPress, onDownPress, onLeftPress, onRightPress }: DPadProps) {
  const color = '#FFE249';
  const shadowColor = '#C4AA1A';
  const sharpShadowColor = 'rgba(13, 81, 66, 0.5)';
  const extrudeOffset = 5; // px
  const shadowOffset = 4; // px — flat sharp shadow below extrusion

  const { pressed, pressProps } = useButtonPress({ keys: ARROW_KEYS });

  const lastTouchEndAtMs = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const triggerDirection = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      switch (direction) {
        case 'up':
          onUpPress?.();
          break;
        case 'down':
          onDownPress?.();
          break;
        case 'left':
          onLeftPress?.();
          break;
        case 'right':
          onRightPress?.();
          break;
      }
    },
    [onDownPress, onLeftPress, onRightPress, onUpPress],
  );

  const directionFromPoint = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return null;

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + (rect.height - (extrudeOffset + shadowOffset)) / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'left' : 'right';
    return dy < 0 ? 'up' : 'down';
  }, []);

  useEffect(() => {
    if (!onUpPress && !onDownPress && !onLeftPress && !onRightPress) return;
    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          triggerDirection('up');
          break;
        case 'ArrowDown':
          triggerDirection('down');
          break;
        case 'ArrowLeft':
          triggerDirection('left');
          break;
        case 'ArrowRight':
          triggerDirection('right');
          break;
      }
    };
    window.addEventListener('keyup', onKeyUp);
    return () => window.removeEventListener('keyup', onKeyUp);
  }, [onDownPress, onLeftPress, onRightPress, onUpPress, triggerDirection]);

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
      ref={containerRef}
      {...pressProps}
      onMouseUp={(e) => {
        pressProps.onMouseUp(e);
        if (Date.now() - lastTouchEndAtMs.current < 750) return;
        const direction = directionFromPoint(e.clientX, e.clientY);
        if (direction) triggerDirection(direction);
      }}
      onTouchEnd={(e) => {
        lastTouchEndAtMs.current = Date.now();
        pressProps.onTouchEnd(e);
        const touch = e.changedTouches[0];
        if (!touch) return;
        const direction = directionFromPoint(touch.clientX, touch.clientY);
        if (direction) triggerDirection(direction);
      }}
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
