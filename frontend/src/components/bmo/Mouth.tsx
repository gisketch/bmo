import { useState, useEffect } from 'react';
import { MouthState } from '../../types/bmo';

interface MouthProps {
  mouthState: MouthState;
}

/**
 * Mouth — Renders SVG mouth shapes based on the provided state.
 * Talk states animate through 3 frames at 150 ms, never repeating
 * the same frame consecutively.
 */
export default function Mouth({ mouthState }: MouthProps) {
  const [talkFrame, setTalkFrame] = useState(0);

  useEffect(() => {
    if (mouthState === MouthState.TalkHappy || mouthState === MouthState.TalkSad) {
      const interval = setInterval(() => {
        setTalkFrame((prev) => {
          let next: number;
          do {
            next = Math.floor(Math.random() * 3);
          } while (next === prev);
          return next;
        });
      }, 150);
      return () => clearInterval(interval);
    }
    setTalkFrame(0);
  }, [mouthState]);

  /* ── Static mouth elements ─────────────────────────────── */

  const openSmile = (
    <svg width="100" height="80" viewBox="0 0 100 100" className="overflow-visible">
      <clipPath id="mouth-clip-smile">
        <path d="M 15 30 C 35 40, 65 40, 85 30 C 105 45, 95 85, 50 85 C 5 85, -5 45, 15 30 Z" />
      </clipPath>
      <path d="M 15 30 C 35 40, 65 40, 85 30 C 105 45, 95 85, 50 85 C 5 85, -5 45, 15 30 Z" fill="#1E8841" />
      <g clipPath="url(#mouth-clip-smile)">
        <path d="M 0 0 L 100 0 L 100 40 C 70 50, 30 50, 0 40 Z" fill="#FCFDFC" />
        <ellipse cx="65" cy="85" rx="45" ry="25" fill="#58B763" />
      </g>
    </svg>
  );

  const openSad = (
    <svg width="100" height="80" viewBox="0 0 100 100" className="overflow-visible">
      <clipPath id="mouth-clip-sad">
        <path d="M 15 80 C 35 70, 65 70, 85 80 C 105 65, 95 25, 50 25 C 5 25, -5 65, 15 80 Z" />
      </clipPath>
      <path d="M 15 80 C 35 70, 65 70, 85 80 C 105 65, 95 25, 50 25 C 5 25, -5 65, 15 80 Z" fill="#1E8841" />
      <g clipPath="url(#mouth-clip-sad)">
        <path d="M 0 0 L 100 0 L 100 45 Q 50 25 0 45 Z" fill="#FCFDFC" />
        <ellipse cx="50" cy="85" rx="40" ry="20" fill="#58B763" />
      </g>
    </svg>
  );

  const wideLineSmile = (
    <svg width="100" height="80" viewBox="0 0 100 100" className="overflow-visible">
      <path d="M 15 50 Q 50 70 85 50" stroke="#242F2B" strokeWidth="4" strokeLinecap="round" fill="transparent" />
    </svg>
  );

  const wideLineSad = (
    <svg width="100" height="80" viewBox="0 0 100 100" className="overflow-visible">
      <path d="M 15 65 Q 50 45 85 65" stroke="#242F2B" strokeWidth="4" strokeLinecap="round" fill="transparent" />
    </svg>
  );

  const mouthOh = (
    <svg width="100" height="80" viewBox="0 0 100 100" className="overflow-visible">
      <clipPath id="mouth-oh-clip">
        <ellipse cx="50" cy="55" rx="20" ry="32" />
      </clipPath>
      <ellipse cx="50" cy="55" rx="20" ry="32" fill="#1E8841" />
      <g clipPath="url(#mouth-oh-clip)">
        <path d="M 0 0 L 100 0 L 100 35 C 70 42, 30 42, 0 35 Z" fill="#FCFDFC" />
        <ellipse cx="50" cy="82" rx="16" ry="12" fill="#58B763" />
      </g>
    </svg>
  );

  /* ── Render ────────────────────────────────────────────── */

  const talkHappyFrames = [openSmile, wideLineSmile, mouthOh];
  const talkSadFrames = [openSad, wideLineSad, mouthOh];

  return (
    <div className="mt-4 flex items-center justify-center h-16">
      {mouthState === MouthState.OpenSmile && openSmile}
      {mouthState === MouthState.MouthOh && mouthOh}
      {mouthState === MouthState.OpenSad && openSad}

      {mouthState === MouthState.TalkHappy && talkHappyFrames[talkFrame]}
      {mouthState === MouthState.TalkSad && talkSadFrames[talkFrame]}

      {(mouthState === MouthState.Smile || mouthState === MouthState.Sad) && (
        <svg width="80" height="30" viewBox="0 0 50 30" className="overflow-visible">
          <path
            d={mouthState === MouthState.Smile ? 'M 5 5 Q 25 30 45 5' : 'M 5 25 Q 25 0 45 25'}
            stroke="#242F2B"
            strokeWidth="4"
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
      )}
    </div>
  );
}
