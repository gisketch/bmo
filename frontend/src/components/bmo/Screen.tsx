import Face from './Face';
import { EyeState, MouthState } from '../../types/bmo';

interface ScreenProps {
  mouthState: MouthState;
  eyeState: EyeState;
}

/**
 * Screen — The inset depth-box container that holds the Face.
 */
export default function Screen({ mouthState, eyeState }: ScreenProps) {
  return (
    <div id="screen" className="flex flex-col w-full pt-12 gap-4">
      <div
        className="relative w-full rounded-[2.5rem]"
        style={{ backgroundColor: '#369683', aspectRatio: '16 / 10' }}
      >
        <div
          className="absolute inset-x-0 bottom-0 rounded-[2.5rem] overflow-hidden"
          style={{ top: '6px', backgroundColor: '#A9FCE4' }}
        >
          <Face mouthState={mouthState} eyeState={eyeState} />
        </div>
      </div>
    </div>
  );
}
