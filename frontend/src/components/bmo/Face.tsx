import { useState, useEffect } from 'react';
import Eye from './Eye';
import Mouth from './Mouth';
import { EyeState, MouthState } from '../../types/bmo';
import { playBmoChuckleSfx } from '../../sfx';

interface FaceProps {
  mouthState: MouthState;
  eyeState: EyeState;
  effect?: 'shake';
  effectKey?: number;
  pose?: 'thinking';
}

/**
 * Face — Coordinates eye blinking and renders eyes + mouth.
 * Blinks both eyes simultaneously at random 1-3 s intervals.
 */
export default function Face({ mouthState, eyeState, effect, effectKey, pose }: FaceProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [shakeActive, setShakeActive] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let blinkHoldId: ReturnType<typeof setTimeout>;

    const triggerBlink = () => {
      setIsBlinking(true);
      blinkHoldId = setTimeout(() => setIsBlinking(false), 100);

      const nextInterval = Math.random() * 2000 + 1000; // 1-3 s
      timeoutId = setTimeout(triggerBlink, nextInterval);
    };

    timeoutId = setTimeout(triggerBlink, Math.random() * 2000 + 1000);
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(blinkHoldId);
    };
  }, []);

  useEffect(() => {
    if (effect !== 'shake') {
      setShakeActive(false);
      return;
    }

    playBmoChuckleSfx();
    setShakeActive(false);
    const rafId = requestAnimationFrame(() => setShakeActive(true));
    const timeoutId = window.setTimeout(() => setShakeActive(false), 300);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [effect, effectKey]);

  const faceAnimClass = shakeActive
    ? 'animate-face-shake'
    : pose === 'thinking'
      ? 'animate-face-think-float'
      : '';

  const leftEyeWrapperStyle = pose === 'thinking' ? { transform: 'translateY(-6px)' } : undefined;
  const rightEyeWrapperStyle = pose === 'thinking' ? { transform: 'translateY(0px)' } : undefined;

  return (
    <div className={`flex flex-col items-center justify-start w-full h-full py-16 ${faceAnimClass}`}>
      <div className="flex flex-row justify-between w-full px-[4.5rem]">
        <div style={leftEyeWrapperStyle}>
          <Eye eyeState={eyeState} isBlinking={isBlinking} side="left" />
        </div>
        <div style={rightEyeWrapperStyle}>
          <Eye eyeState={eyeState} isBlinking={isBlinking} side="right" />
        </div>
      </div>
      <Mouth mouthState={mouthState} />
    </div>
  );
}
