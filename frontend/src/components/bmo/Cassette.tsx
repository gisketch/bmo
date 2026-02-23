import { useEffect, useState } from 'react';
import { playCassetteInSfx, playCassetteOutSfx } from '../../sfx';
import StickerPaper from './StickerPaper';

interface CassetteProps {
  className?: string;
  onEjectedChange?: (isEjected: boolean) => void;
}

type CassetteState = 'inserted' | 'pressing-in' | 'ejecting' | 'ejected' | 'inserting';

const CASSETTE_ANIMATION_MS = 420;

export default function Cassette({ className, onEjectedChange }: CassetteProps) {
  const [state, setState] = useState<CassetteState>('inserted');

  const handlePointerDown = () => {
    if (state === 'inserted') {
      setState('pressing-in');
    }
  };

  const handlePointerUp = () => {
    if (state === 'pressing-in') {
      playCassetteOutSfx();
      setState('ejecting');
    } else if (state === 'ejected') {
      playCassetteInSfx();
      setState('inserting');
    }
  };

  const handlePointerLeave = () => {
    if (state === 'pressing-in') {
      setState('inserted');
    }
  };

  const handlePointerCancel = () => {
    if (state === 'pressing-in') {
      setState('inserted');
    }
  };

  useEffect(() => {
    onEjectedChange?.(state === 'ejected');
  }, [onEjectedChange, state]);

  useEffect(() => {
    if (state === 'ejecting') {
      const timer = setTimeout(() => setState('ejected'), CASSETTE_ANIMATION_MS);
      return () => clearTimeout(timer);
    }
    if (state === 'inserting') {
      const timer = setTimeout(() => setState('inserted'), CASSETTE_ANIMATION_MS);
      return () => clearTimeout(timer);
    }
  }, [state]);

  let transformStyle = '';
  let animationClass = '';

  switch (state) {
    case 'inserted':
      transformStyle = 'translateY(-10px)';
      break;
    case 'pressing-in':
      transformStyle = 'translateY(-2px)';
      break;
    case 'ejecting':
      animationClass = 'animate-cassette-eject';
      break;
    case 'ejected':
      transformStyle = 'translateY(100%)';
      break;
    case 'inserting':
      animationClass = 'animate-cassette-insert';
      break;
  }

  const usesInlineTransform =
    state === 'inserted' || state === 'pressing-in' || state === 'ejected';

  const movementClassName = `${animationClass} ${
    usesInlineTransform ? 'transition-transform duration-150 ease-out' : ''
  }`;

  return (
    <div 
      className={`absolute inset-0 ${className ?? ''}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerCancel}
      style={{ cursor: 'pointer' }}
    >
      <div
        className="absolute overflow-hidden rounded-lg z-20"
        style={{ left: 6, right: 6, top: 0, bottom: 0 }}
      >
        <div
          className={`absolute inset-0 rounded-lg ${movementClassName}`}
          style={{ transform: transformStyle || undefined }}
        >
          <div
            className="absolute rounded-lg"
            style={{
              left: 0,
              right: 0,
              top: 16,
              bottom: -40,
              backgroundColor: '#2f3332',
            }}
          />
        </div>
      </div>
      <div
        className="absolute z-30"
        style={{
          left: 6,
          right: 6,
          top: 0,
          bottom: 0,
          clipPath: 'inset(-1000px 0px 0px 0px)',
        }}
      >
        <div
          className={`absolute rounded-lg overflow-hidden ${movementClassName}`}
          style={{
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: '#3f4443',
            transform: transformStyle || undefined,
          }}
        >
          <StickerPaper
          style={{
            left: 12,
            right: 80,
            height: 32,
            top: -4,
            transform: 'rotate(-2deg)',
          }}
        />
        <div
          className="absolute"
          style={{
            width: 56,
            height: 14 + 3 + 2,
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <div
            className="absolute rounded-lg"
            style={{
              width: 56,
              height: 14,
              top: 3 + 2,
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
            }}
          />
          <div
            className="absolute rounded-lg"
            style={{
              width: 56,
              height: 14,
              top: 3,
              backgroundColor: '#3a3f3e',
            }}
          />
          <div
            className="absolute rounded-lg"
            style={{
              width: 56,
              height: 14,
              top: 0,
              backgroundColor: '#4b504f',
            }}
          />
        </div>
      </div>
      </div>
    </div>
  );
}
