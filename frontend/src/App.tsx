'use client';
import { useEffect } from 'react';
import {
  ControlBar,
  RoomAudioRenderer,
  useSession,
  SessionProvider,
  useAgent,
  BarVisualizer,
  useLocalParticipant,
  useConnectionState,
} from '@livekit/components-react';
import { TokenSource, Track, ConnectionState } from 'livekit-client';
import '@livekit/components-styles';
import './App.css';

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
      <div data-lk-theme="default" className="app-container">
        <StatusBar />
        <AgentView />
        <UserMicView />
        <ControlBar controls={{ microphone: true, camera: false, screenShare: false }} />
        <RoomAudioRenderer />
      </div>
    </SessionProvider>
  );
}

function StatusBar() {
  const connectionState = useConnectionState();
  return (
    <div className="status-bar">
      <p className="connection-status">
        Connection: {connectionState}
      </p>
    </div>
  );
}

function AgentView() {
  const agent = useAgent();
  return (
    <div className="agent-view">
      <p className="agent-state">Agent: {agent.state}</p>
      {agent.canListen && agent.microphoneTrack && (
        <BarVisualizer track={agent.microphoneTrack} state={agent.state} barCount={5} />
      )}
    </div>
  );
}

function UserMicView() {
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const micPub = localParticipant.getTrackPublication(Track.Source.Microphone);
  const micTrack = micPub?.track;

  return (
    <div className="user-mic-view">
      <p className={`mic-status ${isMicrophoneEnabled ? 'mic-on' : 'mic-off'}`}>
        Your Mic: {isMicrophoneEnabled ? 'ON' : 'OFF'}
      </p>
      {micTrack && (
        <BarVisualizer track={micTrack} barCount={5} />
      )}
    </div>
  );
}
