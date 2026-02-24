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
import { EyeState, LedState, MouthState } from './types/bmo';
import type { CassetteMessage } from './types/bmo';
import { initSfx, playCassetteInSfx, playCassetteOutSfx } from './sfx';
import { playBmoHmmSfx } from './sfx';
import type { BmoPage } from './types/bmo';
import MemoriesPage from './components/MemoriesPage';

const CASSETTE_ANIMATION_MS = 420;

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880';
const LIVEKIT_TOKEN = import.meta.env.VITE_LIVEKIT_TOKEN || '';

const tokenSource = TokenSource.literal({
  serverUrl: LIVEKIT_URL,
  participantToken: LIVEKIT_TOKEN,
});

export default function App() {
  if (window.location.pathname === '/memories') {
    return <MemoriesPage />;
  }

  return <BmoApp />;
}

function BmoApp() {
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
  const baseVisualState = useAgentVisualState();
  const agent = useAgent();
  const connectionState = useConnectionState();
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();

  const FACE_OVERRIDE_STATES = [
    { label: 'Smile', mouth: MouthState.Smile, eye: EyeState.Normal, effect: undefined, pose: undefined, mode: undefined },
    { label: 'TalkHappy', mouth: MouthState.TalkHappy, eye: EyeState.Normal, effect: undefined, pose: undefined, mode: undefined },
    { label: 'Thinking', mouth: MouthState.FlatTilt, eye: EyeState.Normal, effect: undefined, pose: 'thinking', mode: undefined },
    { label: 'OpenSmile', mouth: MouthState.OpenSmile, eye: EyeState.Normal, effect: undefined, pose: undefined, mode: undefined },
    { label: 'Shake', mouth: MouthState.OpenSmile, eye: EyeState.ClosedSquished, effect: 'shake', pose: undefined, mode: undefined },
    { label: 'Loading', mouth: MouthState.Smile, eye: EyeState.Normal, effect: undefined, pose: undefined, mode: 'loading', loadingText: 'Loading' },
    { label: 'Sad', mouth: MouthState.Sad, eye: EyeState.Normal, effect: undefined, pose: undefined, mode: undefined },
    { label: 'TalkSad', mouth: MouthState.TalkSad, eye: EyeState.Normal, effect: undefined, pose: undefined, mode: undefined },
    { label: 'OpenSad', mouth: MouthState.OpenSad, eye: EyeState.Normal, effect: undefined, pose: undefined, mode: undefined },
  ] as const;

  const [faceOverrideEnabled, setFaceOverrideEnabled] = useState(false);
  const [faceOverrideIndex, setFaceOverrideIndex] = useState(0);

  const [transientShakeActive, setTransientShakeActive] = useState(false);
  const [transientShakeKey, setTransientShakeKey] = useState(0);
  const transientShakeTimerRef = useRef<number | null>(null);

  const [beepBoopActive, setBeepBoopActive] = useState(false);
  const [beepBoopKey, setBeepBoopKey] = useState(0);
  const beepBoopTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const onPress = (e: Event) => {
      if (faceOverrideEnabled) return;

      const beepBoopPlayed =
        typeof e === 'object' && e && 'detail' in e
          ? Boolean((e as CustomEvent<{ beepBoopPlayed?: boolean }>).detail?.beepBoopPlayed)
          : false;

      if (!beepBoopPlayed) return;

      setBeepBoopKey((prev) => prev + 1);
      setBeepBoopActive(true);

      if (beepBoopTimerRef.current !== null) {
        window.clearTimeout(beepBoopTimerRef.current);
        beepBoopTimerRef.current = null;
      }

      beepBoopTimerRef.current = window.setTimeout(() => {
        setBeepBoopActive(false);
        beepBoopTimerRef.current = null;
      }, 120);
    };

    window.addEventListener('bmo:button-press', onPress);
    return () => window.removeEventListener('bmo:button-press', onPress);
  }, [faceOverrideEnabled]);

  const triggerTransientShake = useCallback(() => {
    if (faceOverrideEnabled) return;
    setTransientShakeKey((prev) => prev + 1);
    setTransientShakeActive(true);
    if (transientShakeTimerRef.current !== null) {
      window.clearTimeout(transientShakeTimerRef.current);
      transientShakeTimerRef.current = null;
    }
    transientShakeTimerRef.current = window.setTimeout(() => {
      setTransientShakeActive(false);
      transientShakeTimerRef.current = null;
    }, 300);
  }, [faceOverrideEnabled]);

  const toggleFaceOverride = useCallback(() => {
    setFaceOverrideEnabled((prev) => {
      const next = !prev;
      if (next) setFaceOverrideIndex(0);
      return next;
    });
  }, []);

  const cycleOverride = useCallback((delta: number) => {
    setFaceOverrideIndex((prev) => {
      const next = prev + delta;
      const len = FACE_OVERRIDE_STATES.length;
      return ((next % len) + len) % len;
    });
  }, []);

  const handleDPadLeft = useCallback(() => {
    if (!faceOverrideEnabled) return;
    cycleOverride(-1);
  }, [cycleOverride, faceOverrideEnabled]);

  const handleDPadRight = useCallback(() => {
    if (!faceOverrideEnabled) return;
    cycleOverride(1);
  }, [cycleOverride, faceOverrideEnabled]);

  const [cassetteMessage, setCassetteMessage] = useState<CassetteMessage | null>(null);
  const [cassetteModalOpen, setCassetteModalOpen] = useState(false);
  const [cassettePhase, setCassettePhase] = useState<'insert' | 'steady' | 'eject'>('steady');
  const cassetteMessageRef = useRef<CassetteMessage | null>(null);
  const cassetteTimerRef = useRef<number | null>(null);

  const [loadingStatusText, setLoadingStatusText] = useState<string | null>(null);

  useEffect(() => {
    if (cassettePhase !== 'insert') return;
    triggerTransientShake();
  }, [cassettePhase, triggerTransientShake]);

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

  useEffect(() => {
    const handleLoadingStatus = (payload: Uint8Array, _participant: unknown, _kind: unknown, topic?: string) => {
      if (topic !== 'loading-status') return;
      try {
        const message = JSON.parse(new TextDecoder().decode(payload)) as unknown;
        if (!message || typeof message !== 'object') return;
        const text = (message as { text?: unknown }).text;
        if (typeof text === 'string' && text.trim()) {
          setLoadingStatusText(text);
        }
      } catch {
        // ignore malformed payloads
      }
    };

    room.on(RoomEvent.DataReceived, handleLoadingStatus);
    return () => { room.off(RoomEvent.DataReceived, handleLoadingStatus); };
  }, [room]);

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

  const agentConnected = faceOverrideEnabled ? true : !isDisconnected;

  // Audio-reactive glow for talking (agent output)
  const agentVolume = useTrackVolume(
    ledState === LedState.Talking ? agent.microphoneTrack : undefined,
  );
  const glowIntensity = ledState === LedState.Talking ? agentVolume : 0;

  const cassetteOverrideActive = cassettePhase !== 'steady' && !isDisconnected;

  const overridePreset = faceOverrideEnabled
    ? FACE_OVERRIDE_STATES[faceOverrideIndex]
    : null;

  const shakeOverrideActive = transientShakeActive && !isDisconnected;
  const beepBoopOverrideActive = beepBoopActive && !isDisconnected;
  const thinkingPoseActive = !isDisconnected && agent.state === 'thinking';

  const prevAgentStateRef = useRef(agent.state);
  useEffect(() => {
    const prev = prevAgentStateRef.current;
    prevAgentStateRef.current = agent.state;

    if (faceOverrideEnabled) return;
    if (prev === agent.state) return;
    if (agent.state === 'thinking') playBmoHmmSfx();
    if (prev === 'thinking') setLoadingStatusText(null);
  }, [agent.state, faceOverrideEnabled]);

  useEffect(() => {
    if (isDisconnected) setLoadingStatusText(null);
  }, [isDisconnected]);

  const loadingActive = !!loadingStatusText && !isDisconnected;

  const faceState = overridePreset
    ? overridePreset
    : shakeOverrideActive
      ? { mouth: MouthState.OpenSmile, eye: EyeState.ClosedSquished }
      : beepBoopOverrideActive
        ? { mouth: MouthState.MouthOh, eye: EyeState.ClosedSquished }
        : loadingActive
          ? { mouth: MouthState.Smile, eye: EyeState.Normal }
          : thinkingPoseActive
            ? { mouth: MouthState.FlatTilt, eye: EyeState.Normal }
          : cassetteOverrideActive
            ? { mouth: MouthState.OpenSmile, eye: EyeState.Normal }
            : baseVisualState;

  const faceEffect = overridePreset?.effect ?? (shakeOverrideActive ? 'shake' : undefined);
  const faceEffectKey = overridePreset
    ? faceOverrideIndex
    : shakeOverrideActive
      ? transientShakeKey
      : beepBoopOverrideActive
        ? beepBoopKey
        : undefined;

  const facePose = overridePreset?.pose ?? (
    shakeOverrideActive || beepBoopOverrideActive
      ? undefined
      : thinkingPoseActive
        ? 'thinking'
        : undefined
  );

  const faceMode = overridePreset?.mode ?? (loadingActive ? 'loading' : undefined);
  const loadingText = overridePreset && 'loadingText' in overridePreset
    ? overridePreset.loadingText
    : loadingActive
      ? loadingStatusText
      : undefined;

  return (
    <Body>
      <CassetteModal
        open={cassetteModalOpen && !!cassetteMessage}
        title={cassetteMessage?.title ?? ''}
        content={cassetteMessage?.content ?? ''}
        onClose={closeCassetteModal}
      />
      {/* Face area — top-aligned */}
      <div className="w-full flex flex-col flex-1 min-h-0 relative">
        {faceOverrideEnabled ? (
          <div className="absolute top-0 left-0 right-0 flex justify-center pt-2 pointer-events-none text-xs font-semibold tracking-widest text-slate-900/60">
            TEST MODE: {FACE_OVERRIDE_STATES[faceOverrideIndex].label}
          </div>
        ) : null}
        <Screen
          mouthState={faceState.mouth}
          eyeState={faceState.eye}
          faceEffect={faceEffect}
          faceEffectKey={faceEffectKey}
          facePose={facePose}
          faceMode={faceMode}
          loadingText={loadingText}
          activePage={activePage}
          statusData={statusData}
          statusLoading={statusLoading}
          agentConnected={agentConnected}
          onGlassShake={triggerTransientShake}
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
          onTrianglePress={toggleFaceOverride}
          onReconnectPress={handleGreenPress}
          onDPadLeftPress={handleDPadLeft}
          onDPadRightPress={handleDPadRight}
        />
      </div>

      <RoomAudioRenderer />
    </Body>
  );
}
