import Face from './Face';
import StatusPage from './StatusPage';
import CRTEffect from './CRTEffect';
import { useEffect, useRef, useState } from 'react';
import { playTapGlassSfx, playTvOffSfx, playTvOnSfx } from '../../sfx';
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
  const [bootOff, setBootOff] = useState(true);
  const screenOff = bootOff || !agentConnected;

  const powerMs = 180;

  const [powerAnim, setPowerAnim] = useState<'on' | 'off' | null>(null);
  const [contentVisible, setContentVisible] = useState(!screenOff);
  const prevScreenOff = useRef(screenOff);

  useEffect(() => {
    const timeoutId = setTimeout(() => setBootOff(false), 500);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (prevScreenOff.current === screenOff) return;
    if (screenOff) playTvOffSfx();
    else playTvOnSfx();
    prevScreenOff.current = screenOff;

    if (screenOff) {
      setPowerAnim('off');
      const timeoutId = setTimeout(() => setContentVisible(false), powerMs);
      return () => clearTimeout(timeoutId);
    }

    setContentVisible(true);
    setPowerAnim('on');
  }, [screenOff]);

  useEffect(() => {
    if (!powerAnim) return;
    const timeoutId = setTimeout(() => setPowerAnim(null), powerMs + 60);
    return () => clearTimeout(timeoutId);
  }, [powerAnim]);

  return (
    <div id="screen" className="flex flex-1 min-h-0 flex-col w-full pt-12 gap-4">
      <div
        className="relative w-full flex-1 min-h-0 rounded-[2.5rem]"
        style={{ backgroundColor: '#369683' }}
      >
        <div
          className="absolute inset-x-0 bottom-0 rounded-[2.5rem] overflow-hidden"
          style={{ top: '6px' }}
          onMouseDown={(e) => {
            e.stopPropagation();
            playTapGlassSfx();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            playTapGlassSfx();
          }}
        >
          {screenOff || powerAnim === 'on' ? (
            <div className="absolute inset-0" style={{ backgroundColor: '#0D4538' }} />
          ) : null}

          {!contentVisible ? null : (
            <div
              className={`absolute inset-0 origin-center ${
                powerAnim === 'on'
                  ? 'animate-crt-power-on'
                  : powerAnim === 'off'
                    ? 'animate-crt-power-off'
                    : ''
              }`}
              style={{ backgroundColor: '#A9FCE4' }}
            >
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
          )}

          <CRTEffect flicker={!screenOff} reflection={!(screenOff || powerAnim === 'on')} />
        </div>
      </div>
    </div>
  );
}
