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
import CassetteModal from './components/bmo/CassetteModal';
import { useAgentVisualState } from './hooks/useAgentVisualState';
import { useTrackVolume } from './hooks/useTrackVolume';
import { useStatusData } from './hooks/useStatusData';
import { LedState } from './types/bmo';
import type { CassetteMessage } from './types/bmo';
import { initSfx, playCassetteInSfx, playCassetteOutSfx } from './sfx';
import type { BmoPage } from './types/bmo';

const CASSETTE_ANIMATION_MS = 420;

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

  const [cassetteMessage, setCassetteMessage] = useState<CassetteMessage | null>(null);
  const [cassetteModalOpen, setCassetteModalOpen] = useState(false);
  const [cassettePhase, setCassettePhase] = useState<'insert' | 'steady' | 'eject'>('steady');
  const cassetteMessageRef = useRef<CassetteMessage | null>(null);
  const cassetteTimerRef = useRef<number | null>(null);

  useEffect(() => {
    cassetteMessageRef.current = cassetteMessage;
  }, [cassetteMessage]);

  const clearCassetteTimer = useCallback(() => {
    if (cassetteTimerRef.current === null) return;
    window.clearTimeout(cassetteTimerRef.current);
    cassetteTimerRef.current = null;
  }, []);

  const startCassetteInsert = useCallback((nextMessage: CassetteMessage) => {
    setCassetteMessage(nextMessage);
    setCassettePhase('insert');
    playCassetteInSfx();

    cassetteTimerRef.current = window.setTimeout(() => {
      setCassettePhase('steady');
      cassetteTimerRef.current = null;
    }, CASSETTE_ANIMATION_MS);
  }, []);

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

  const closeCassetteModal = useCallback(() => {
    setCassetteModalOpen(false);
  }, []);

  // Status data (only fetches when status page is active)
  const { data: statusData, loading: statusLoading } = useStatusData(activePage === 'status');

  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array, _participant: unknown, _kind: unknown, topic?: string) => {
      if (topic !== 'cassette') return;
      try {
        const message = JSON.parse(new TextDecoder().decode(payload)) as unknown;
        if (!message || typeof message !== 'object') return;

        const title = (message as { title?: unknown }).title;
        const content = (message as { content?: unknown }).content;
        if (typeof title !== 'string' || typeof content !== 'string') return;

        const nextCassette: CassetteMessage = { title, content };

        setCassetteModalOpen(false);

        clearCassetteTimer();

        if (!cassetteMessageRef.current) {
          startCassetteInsert(nextCassette);
          return;
        }

        setCassettePhase('eject');
        playCassetteOutSfx();

        cassetteTimerRef.current = window.setTimeout(() => {
          cassetteTimerRef.current = null;
          startCassetteInsert(nextCassette);
        }, CASSETTE_ANIMATION_MS);
      } catch {
        // ignore malformed payloads
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => { room.off(RoomEvent.DataReceived, handleDataReceived); };
  }, [room, clearCassetteTimer, startCassetteInsert]);

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
      <CassetteModal
        open={cassetteModalOpen && !!cassetteMessage}
        title={cassetteMessage?.title ?? ''}
        content={cassetteMessage?.content ?? ''}
        onClose={closeCassetteModal}
      />
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
      <FirstRow
        className="shrink-0"
        ledState={ledState}
        glowIntensity={glowIntensity}
        cassetteTitle={cassetteMessage?.title}
        cassetteAnimation={cassettePhase === 'steady' ? undefined : cassettePhase}
        onCassettePress={
          cassetteMessage
            ? () => {
                playCassetteInSfx();
                setCassetteModalOpen(true);
              }
            : undefined
        }
      />
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
