import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RoomAudioRenderer,
  useSession,
  SessionProvider,
  useAgent,
  useConnectionState,
  useLocalParticipant,
  useRoomContext,
} from '@livekit/components-react';
import { ConnectionState, TokenSource, RoomEvent } from 'livekit-client';
import '@livekit/components-styles';
import { Body, FirstRow, Screen, SecondRow } from './components/bmo';
import { useAgentVisualState } from './hooks/useAgentVisualState';
import { useTrackVolume } from './hooks/useTrackVolume';
import { useStatusData } from './hooks/useStatusData';
import { LedState } from './types/bmo';
import { initSfx } from './sfx';
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
    initSfx();
    session.start();
    return () => {
      session.end();
    };
  }, []);

  const handleReconnect = useCallback(async () => {
    await session.end();
    await session.start();
  }, [session]);

  const handleForceDisconnect = useCallback(async () => {
    await session.end();
  }, [session]);

  return (
    <SessionProvider session={session}>
      <div data-lk-theme="default">
        <BmoLayout onReconnect={handleReconnect} onForceDisconnect={handleForceDisconnect} />
      </div>
    </SessionProvider>
  );
}

/**
 * Main BMO layout — lifts agent visual state so both Face and FirstRow can use it.
 */
function BmoLayout({ onReconnect, onForceDisconnect }: { onReconnect: () => void; onForceDisconnect: () => void }) {
  const { mouth, eye } = useAgentVisualState();
  const agent = useAgent();
  const connectionState = useConnectionState();
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();

  // TODO: remove after testing disconnected UI state
  const [forceDisconnected, setForceDisconnected] = useState(false);

  const fullyConnected = connectionState === ConnectionState.Connected && room.state === ConnectionState.Connected;

  // 5-tap force disconnect on green button (2s window)
  const tapTimestamps = useRef<number[]>([]);
  const handleGreenPress = useCallback(() => {
    const now = Date.now();
    tapTimestamps.current = tapTimestamps.current.filter((t) => now - t < 2000);
    tapTimestamps.current.push(now);

    if (fullyConnected) {
      if (tapTimestamps.current.length >= 5) {
        tapTimestamps.current = [];
        onForceDisconnect();
      }
      return;
    }

    tapTimestamps.current = [];
    onReconnect();
  }, [onReconnect, onForceDisconnect, fullyConnected]);

  // Page toggle state
  const [activePage, setActivePage] = useState<BmoPage>('face');
  const togglePage = useCallback(() => {
    setActivePage((prev) => (prev === 'face' ? 'status' : 'face'));
  }, []);

  // Status data (only fetches when status page is active)
  const { data: statusData, loading: statusLoading } = useStatusData(activePage === 'status');

  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array, _participant: unknown, _kind: unknown, topic?: string) => {
      if (topic !== 'cassette') return;
      try {
        const message = JSON.parse(new TextDecoder().decode(payload));
        console.log('CASSETTE MESSAGE RECEIVED:', message);
      } catch {
        // ignore malformed payloads
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => { room.off(RoomEvent.DataReceived, handleDataReceived); };
  }, [room]);

  const toggleMute = useCallback(() => {
    localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  }, [localParticipant, isMicrophoneEnabled]);

  // Determine LED state from agent/connection state
  let ledState = LedState.Connected;
  const isDisconnected =
    connectionState === ConnectionState.Disconnected ||
    connectionState === ConnectionState.Reconnecting;
  const disconnectedForUi = isDisconnected || forceDisconnected;
  if (disconnectedForUi) {
    ledState = LedState.Offline;
  } else if (agent.state === 'speaking') {
    ledState = LedState.Talking;
  }

  const agentConnected = !disconnectedForUi;

  // Audio-reactive glow for talking (agent output)
  const agentVolume = useTrackVolume(
    ledState === LedState.Talking ? agent.microphoneTrack : undefined,
  );
  const glowIntensity = ledState === LedState.Talking ? agentVolume : 0;

  return (
    <Body>
      {/* Face area — top-aligned */}
      <div className="w-full flex flex-col flex-1 min-h-0">
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
      <FirstRow className="shrink-0" ledState={ledState} glowIntensity={glowIntensity} />
      <div className="shrink-0 w-full pb-24">
        <SecondRow
          isMuted={!isMicrophoneEnabled}
          onToggleMute={toggleMute}
          onStartPress={togglePage}
          onTrianglePress={() => setForceDisconnected((prev) => !prev)}
          onReconnectPress={handleGreenPress}
        />
      </div>

      <RoomAudioRenderer />
    </Body>
  );
}
