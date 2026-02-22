import { useCallback, useEffect } from 'react';
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
import { LedState } from './types/bmo';

const TOKEN_SERVER_URL =
  import.meta.env.VITE_TOKEN_SERVER_URL || 'http://localhost:3001/getToken';

const tokenSource = TokenSource.endpoint(TOKEN_SERVER_URL);

export default function App() {
  const session = useSession(tokenSource, { agentName: 'voice-agent' });

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

  const toggleMute = useCallback(() => {
    localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  }, [localParticipant, isMicrophoneEnabled]);

  // Determine LED state from agent/connection state
  let ledState = LedState.Connected;
  if (
    connectionState === ConnectionState.Disconnected ||
    connectionState === ConnectionState.Reconnecting
  ) {
    ledState = LedState.Offline;
  } else if (agent.state === 'speaking') {
    ledState = LedState.Talking;
  }

  // Audio-reactive glow for talking (agent output)
  const agentVolume = useTrackVolume(
    ledState === LedState.Talking ? agent.microphoneTrack : undefined,
  );
  const glowIntensity = ledState === LedState.Talking ? agentVolume : 0;

  return (
    <Body>
      {/* Face area — top-aligned */}
      <div className="w-full">
        <Screen mouthState={mouth} eyeState={eye} />
      </div>

      {/* BMO body details */}
      <FirstRow ledState={ledState} glowIntensity={glowIntensity} />
      <SecondRow isMuted={!isMicrophoneEnabled} onToggleMute={toggleMute} />

      <RoomAudioRenderer />
    </Body>
  );
}
