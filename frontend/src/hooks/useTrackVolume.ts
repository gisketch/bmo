import { useState, useEffect, useRef } from 'react';
import type { TrackReference } from '@livekit/components-core';
import type { TrackPublication } from 'livekit-client';

/**
 * Analyzes an audio track's volume level in real-time.
 * Accepts a TrackReference (from useAgent) or TrackPublication (from useLocalParticipant).
 * Returns a normalized value 0–1 representing current loudness.
 */
export function useTrackVolume(
  track: TrackReference | TrackPublication | undefined,
): number {
  const [volume, setVolume] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // Extract the MediaStreamTrack from either format
    let mediaStreamTrack: MediaStreamTrack | undefined;
    if (track && 'publication' in track) {
      // TrackReference
      mediaStreamTrack = track.publication?.track?.mediaStreamTrack;
    } else if (track) {
      // TrackPublication
      mediaStreamTrack = track.track?.mediaStreamTrack;
    }

    if (!mediaStreamTrack) {
      setVolume(0);
      return;
    }

    const stream = new MediaStream([mediaStreamTrack]);

    let audioCtx: AudioContext;
    let analyser: AnalyserNode;
    let source: MediaStreamAudioSourceNode;

    try {
      audioCtx = new AudioContext();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;

      source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
    } catch {
      // Graceful fallback: AudioContext unavailable or track invalid
      setVolume(0);
      return;
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const avg = sum / dataArray.length / 255;
      setVolume(avg);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      source.disconnect();
      analyser.disconnect();
      audioCtx.close();
    };
  }, [track]);

  return volume;
}
