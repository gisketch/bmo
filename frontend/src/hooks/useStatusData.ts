import { useState, useEffect, useCallback, useRef } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { ParticipantKind } from 'livekit-client';
import type { StatusData } from '../types/bmo';

const POLL_INTERVAL_MS = 30_000;
const RPC_TIMEOUT_MS = 10_000;

/**
 * Fetches status data from the agent via LiveKit RPC.
 * Polls every 30 seconds while `active` is true; stops when false.
 */
export function useStatusData(active: boolean) {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const room = useRoomContext();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!room?.localParticipant) return;

    // Find the agent participant
    const participants = Array.from(room.remoteParticipants.values());
    const agent = participants.find(
      (p) => p.kind === ParticipantKind.AGENT,
    );

    if (!agent) {
      setData(null);
      return;
    }

    try {
      setLoading(true);
      const response = await room.localParticipant.performRpc({
        destinationIdentity: agent.identity,
        method: 'getStatus',
        payload: '',
        responseTimeout: RPC_TIMEOUT_MS,
      });
      const parsed: StatusData = JSON.parse(response);
      setData(parsed);
    } catch (err) {
      console.warn('Status RPC failed:', err);
      // Keep stale data if we previously had data, otherwise null
    } finally {
      setLoading(false);
    }
  }, [room]);

  useEffect(() => {
    if (!active) {
      // Stop polling when status page is hidden
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Fetch immediately when activated
    fetchStatus();

    // Poll every 30s
    intervalRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active, fetchStatus]);

  return { data, loading };
}
