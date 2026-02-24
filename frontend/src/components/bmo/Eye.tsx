import { EyeState } from '../../types/bmo';

interface EyeProps {
  /** Current eye state (extensible for future states) */
  eyeState: EyeState;
  /** Whether the eye is mid-blink */
  isBlinking: boolean;
  side?: 'left' | 'right';
}

/**
 * Eye — A round dot that squishes vertically to simulate a blink.
 *
 * TODO: Extend with eyeState-driven rendering when new eye states
 * (e.g. Happy, Angry, Sleepy) are added to the EyeState enum.
 */
export default function Eye({ eyeState, isBlinking, side = 'left' }: EyeProps): JSX.Element {
  if (eyeState === EyeState.ClosedSquished) {
    const stroke = '#242F2B';
    const left = side === 'left';
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" className="overflow-visible">
        <path
          d={left ? 'M 5 5 L 18 12 L 5 19' : 'M 19 5 L 6 12 L 19 19'}
          stroke={stroke}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }

  const closed = eyeState === EyeState.Closed;
  return (
    <div
      className="w-5 h-6 rounded-full transition-transform duration-75 ease-in-out origin-center"
      style={{
        backgroundColor: '#242F2B',
        transform: closed || isBlinking ? 'scaleY(0.1)' : 'scaleY(1)',
      }}
    />
  );
}
