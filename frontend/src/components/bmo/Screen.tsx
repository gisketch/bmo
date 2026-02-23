import Face from './Face';
import StatusPage from './StatusPage';
import CRTEffect from './CRTEffect';
import { EyeState, MouthState } from '../../types/bmo';
import type { BmoPage, StatusData } from '../../types/bmo';

interface ScreenProps {
  mouthState: MouthState;
  eyeState: EyeState;
  activePage: BmoPage;
  statusData: StatusData | null;
  statusLoading: boolean;
  agentConnected: boolean;
}

/**
 * Screen — The inset depth-box container that holds the Face or StatusPage.
 */
export default function Screen({
  mouthState,
  eyeState,
  activePage,
  statusData,
  statusLoading,
  agentConnected,
}: ScreenProps) {
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
          <CRTEffect />
          <div className="w-full h-full animate-crt-warp">
            {activePage === 'face' ? (
              <Face mouthState={mouthState} eyeState={eyeState} />
            ) : (
              <StatusPage
                statusData={statusData}
                agentConnected={agentConnected}
                loading={statusLoading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
