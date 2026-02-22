import { useEffect } from 'react';
import {
  ControlBar,
  RoomAudioRenderer,
  useSession,
  SessionProvider,
  useAgent,
  BarVisualizer,
} from '@livekit/components-react';
import { TokenSource } from 'livekit-client';
import '@livekit/components-styles';
import { Body, Screen } from './components/bmo';
import { useAgentVisualState } from './hooks/useAgentVisualState';

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
        <Body>
          {/* Face area — centered, takes remaining space */}
          <div className="flex-1 flex items-center justify-center w-full">
            <BmoFace />
          </div>

          {/* Bottom controls area */}
          <div className="flex flex-col items-center gap-4 w-full pb-8 px-4">
            <AgentAudioBar />
            <ControlBar controls={{ microphone: true, camera: false, screenShare: false }} />
          </div>

          <RoomAudioRenderer />
        </Body>
      </div>
    </SessionProvider>
  );
}

/**
 * The BMO face driven by the live agent state.
 */
function BmoFace() {
  const { mouth, eye } = useAgentVisualState();
  return <Screen mouthState={mouth} eyeState={eye} />;
}

/**
 * Agent audio visualizer bar — shown when the agent can listen.
 */
function AgentAudioBar() {
  const agent = useAgent();

  if (!agent.canListen || !agent.microphoneTrack) return null;

  return (
    <div className="w-full max-w-xs">
      <BarVisualizer track={agent.microphoneTrack} state={agent.state} barCount={5} />
    </div>
  );
}
