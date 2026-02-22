import type { EyeState } from '../../types/bmo';

interface EyeProps {
  /** Current eye state (extensible for future states) */
  eyeState: EyeState;
  /** Whether the eye is mid-blink */
  isBlinking: boolean;
}

/**
 * Eye — A round dot that squishes vertically to simulate a blink.
 *
 * TODO: Extend with eyeState-driven rendering when new eye states
 * (e.g. Happy, Angry, Sleepy) are added to the EyeState enum.
 */
export default function Eye({ eyeState: _eyeState, isBlinking }: EyeProps) {
  return (
    <div
      className="w-5 h-6 rounded-full transition-transform duration-75 ease-in-out origin-center"
      style={{
        backgroundColor: '#242F2B',
        transform: isBlinking ? 'scaleY(0.1)' : 'scaleY(1)',
      }}
    />
  );
}
