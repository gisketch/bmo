import { useState, useEffect } from 'react';
import Eye from './Eye';
import Mouth from './Mouth';
import { EyeState, MouthState } from '../../types/bmo';

interface FaceProps {
  mouthState: MouthState;
  eyeState: EyeState;
}

/**
 * Face — Coordinates eye blinking and renders eyes + mouth.
 * Blinks both eyes simultaneously at random 1-3 s intervals.
 */
export default function Face({ mouthState, eyeState }: FaceProps) {
  const [isBlinking, setIsBlinking] = useState(false);

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

  return (
    <div className="flex flex-col items-center justify-start w-full h-full py-16">
      <div className="flex flex-row justify-between w-full px-[4.5rem]">
        <Eye eyeState={eyeState} isBlinking={isBlinking} />
        <Eye eyeState={eyeState} isBlinking={isBlinking} />
      </div>
      <Mouth mouthState={mouthState} />
    </div>
  );
}
