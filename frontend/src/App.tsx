import { useCallback, useEffect, useState } from 'react';
import {
  RoomAudioRenderer,
  useSession,
  SessionProvider,
  useAgent,
  useConnectionState,
  useLocalParticipant,
} from '@livekit/components-react';
import { ConnectionState, TokenSource } from 'livekit-client';
import '@livekit/components-styles';
import { Body, FirstRow, Screen, SecondRow } from './components/bmo';
import { useAgentVisualState } from './hooks/useAgentVisualState';
import { useTrackVolume } from './hooks/useTrackVolume';
import { useStatusData } from './hooks/useStatusData';
import { LedState } from './types/bmo';
import type { BmoPage } from './types/bmo';

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880';
const LIVEKIT_TOKEN = import.meta.env.VITE_LIVEKIT_TOKEN || '';

const tokenSource = TokenSource.literal({
  serverUrl: LIVEKIT_URL,
  participantToken: LIVEKIT_TOKEN,
});

export default function App() {
  const session = useSession(tokenSource);

  useEffect(() => {
    session.start();
    return () => {
      session.end();
    };
  }, []);

  return (
    <SessionProvider session={session}>
      <div data-lk-theme="default">
        <BmoLayout />
      </div>
    </SessionProvider>
  );
}

/**
 * Main BMO layout — lifts agent visual state so both Face and FirstRow can use it.
 */
function BmoLayout() {
  const { mouth, eye } = useAgentVisualState();
  const agent = useAgent();
  const connectionState = useConnectionState();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();

  // Page toggle state
  const [activePage, setActivePage] = useState<BmoPage>('face');
  const togglePage = useCallback(() => {
    setActivePage((prev) => (prev === 'face' ? 'status' : 'face'));
  }, []);

  // Status data (only fetches when status page is active)
  const { data: statusData, loading: statusLoading } = useStatusData(activePage === 'status');

  const toggleMute = useCallback(() => {
    localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  }, [localParticipant, isMicrophoneEnabled]);

  // Determine LED state from agent/connection state
  let ledState = LedState.Connected;
  const isDisconnected =
    connectionState === ConnectionState.Disconnected ||
    connectionState === ConnectionState.Reconnecting;
  if (isDisconnected) {
    ledState = LedState.Offline;
  } else if (agent.state === 'speaking') {
    ledState = LedState.Talking;
  }

  const agentConnected = !isDisconnected;

  // Audio-reactive glow for talking (agent output)
  const agentVolume = useTrackVolume(
    ledState === LedState.Talking ? agent.microphoneTrack : undefined,
  );
  const glowIntensity = ledState === LedState.Talking ? agentVolume : 0;

  return (
    <Body>
      {/* Face area — top-aligned */}
      <div className="w-full">
        <Screen
          mouthState={mouth}
          eyeState={eye}
          activePage={activePage}
          statusData={statusData}
          statusLoading={statusLoading}
          agentConnected={agentConnected}
        />
      </div>

      {/* BMO body details */}
      <FirstRow ledState={ledState} glowIntensity={glowIntensity} />
      <SecondRow
        isMuted={!isMicrophoneEnabled}
        onToggleMute={toggleMute}
        onStartPress={togglePage}
      />

      <RoomAudioRenderer />
    </Body>
  );
}
