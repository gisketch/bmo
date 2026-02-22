import { useAgent, useConnectionState } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { AGENT_VISUAL_STATES, type AgentVisualState } from '../types/bmo';

/**
 * Maps LiveKit agent state + connection state to BMO visual state.
 *
 * Mapping:
 *   disconnected / reconnecting → offline  (Sad)
 *   agent speaking               → talking  (TalkHappy)
 *   agent thinking               → thinking (MouthOh)
 *   otherwise (listening)        → listening (Smile)
 */
export function useAgentVisualState(): AgentVisualState {
  const agent = useAgent();
  const connectionState = useConnectionState();

  if (
    connectionState === ConnectionState.Disconnected ||
    connectionState === ConnectionState.Reconnecting
  ) {
    return AGENT_VISUAL_STATES.offline;
  }

  switch (agent.state) {
    case 'speaking':
      return AGENT_VISUAL_STATES.talking;
    case 'thinking':
      return AGENT_VISUAL_STATES.thinking;
    case 'listening':
    default:
      return AGENT_VISUAL_STATES.listening;
  }
}
