import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import CRTEffect from './CRTEffect';
import ModalStickerPaper from './ModalStickerPaper';
import { playCassetteOutSfx } from '../../sfx';

interface CassetteModalProps {
  open: boolean;
  title: string;
  content: string;
  onClose: () => void;
}

function Screw({ style }: { style: CSSProperties }) {
  const size = 12;
  return (
    <div className="absolute pointer-events-none" style={{ ...style, width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: '#5e6362', transform: 'translateY(3px)' }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: '#7b807f' }}
      />
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: 8,
          height: 2,
          backgroundColor: 'rgba(0,0,0,0.35)',
          transform: 'translate(-50%, -50%)',
          borderRadius: 2,
        }}
      />
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: 2,
          height: 8,
          backgroundColor: 'rgba(0,0,0,0.35)',
          transform: 'translate(-50%, -50%)',
          borderRadius: 2,
        }}
      />
    </div>
  );
}

export default function CassetteModal({ open, title, content, onClose }: CassetteModalProps) {
  const [rendered, setRendered] = useState(open);
  const [phase, setPhase] = useState<'enter' | 'entered' | 'exit'>(open ? 'enter' : 'exit');
  const closeTimerRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const handleCopyAndClose = () => {
    try {
      void navigator.clipboard?.writeText(content);
    } catch {
      // ignore
    }
    onCloseRef.current();
  };

  useEffect(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (open) {
      setRendered(true);
      setPhase('enter');
      const rafId = window.requestAnimationFrame(() => setPhase('entered'));

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onCloseRef.current();
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.cancelAnimationFrame(rafId);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }

    if (!rendered) return;

    setPhase('exit');
    playCassetteOutSfx();
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setRendered(false);
    }, 200);
  }, [open, rendered]);

  if (!rendered) return null;

  const entered = phase === 'entered';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{ zIndex: 1000 }}
    >
      <div
        className={`absolute inset-0 transition-all duration-200 ease-out ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundColor: 'rgba(0,0,0,0.55)',
          backdropFilter: entered ? 'blur(6px)' : 'blur(0px)',
        }}
        onClick={() => onCloseRef.current()}
      />
      <div
        className={`relative z-10 w-full max-w-lg mx-4 rounded-lg transition-all duration-200 ease-out ${
          entered ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
        }`}
        style={{ fontFamily: "'Geist Mono', monospace" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="absolute inset-0 rounded-lg"
          style={{ backgroundColor: '#2f3332', transform: 'translateY(12px)' }}
        />

        <div
          className="relative rounded-lg"
          style={{ backgroundColor: '#3f4443' }}
        >
          <Screw style={{ left: 10, top: 10 }} />
          <Screw style={{ right: 10, top: 10 }} />
          <Screw style={{ left: 10, bottom: 10 }} />
          <Screw style={{ right: 10, bottom: 10 }} />

          <div className="max-h-[70vh] flex flex-col px-6 pt-8 pb-0">
            <div className="flex-1 overflow-auto">
              <div className="w-full rounded-lg">
                <ModalStickerPaper
                  className="h-16 rounded-t-lg rounded-b-none"
                  text={title}
                />
                <div
                  className="relative w-full overflow-hidden rounded-t-none rounded-b-none"
                  style={{ backgroundColor: '#2f3332' }}
                  aria-label={title}
                >
                  <div className="relative px-6 py-6">
                    <pre
                      className="whitespace-pre-wrap text-sm"
                      style={{ color: 'rgba(243,238,213,0.85)', fontFamily: 'inherit' }}
                    >
                      {content}
                    </pre>
                  </div>
                  <CRTEffect
                    flicker
                    reflection
                    roundedClassName="rounded-t-none rounded-b-none"
                  />
                </div>
              </div>
            </div>

            <div
              className="mt-3 mx-16 relative overflow-hidden rounded-t-lg rounded-b-none"
              style={{ backgroundColor: '#3a3f3e', filter: 'brightness(0.88)' }}
            >
              <div
                className="absolute inset-x-0 top-0"
                style={{
                  height: 10,
                  backgroundColor: '#2f3332',
                  opacity: 0.45,
                  borderTopLeftRadius: 10,
                  borderTopRightRadius: 10,
                }}
              />
              <div className="h-20 flex">
                <button
                  type="button"
                  className="flex-1 h-full flex items-center justify-center"
                  style={{ color: 'rgba(243,238,213,0.75)' }}
                  aria-label="Copy"
                  onClick={handleCopyAndClose}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" viewBox="0 0 24 24">
                    <path
                      opacity="0.5"
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M21.9998 6.42632L21.9998 17.5737C21.9998 19.4211 20.3991 20.5888 19.0966 19.6916L13 15.2316V8.76844L19.0966 4.30838C20.3991 3.41122 21.9998 4.57895 21.9998 6.42632Z"
                      fill="currentColor"
                    />
                    <path
                      d="M13 7.12303L13 16.877C13 18.4934 11.5327 19.5152 10.3388 18.7302L2.92135 13.8532C1.69288 13.0455 1.69288 10.9545 2.92136 10.1468L10.3388 5.26983C11.5327 4.48482 13 5.50658 13 7.12303Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
                <div className="h-full" style={{ width: 2, backgroundColor: '#2f3332', opacity: 0.45 }} />
                <button
                  type="button"
                  className="flex-1 h-full flex items-center justify-center"
                  style={{ color: 'rgba(243,238,213,0.75)' }}
                  aria-label="Action"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M6.59961 11.3974C6.59961 8.67119 6.59961 7.3081 7.44314 6.46118C8.28667 5.61426 9.64432 5.61426 12.3596 5.61426H15.2396C17.9549 5.61426 19.3125 5.61426 20.1561 6.46118C20.9996 7.3081 20.9996 8.6712 20.9996 11.3974V16.2167C20.9996 18.9429 20.9996 20.306 20.1561 21.1529C19.3125 21.9998 17.9549 21.9998 15.2396 21.9998H12.3596C9.64432 21.9998 8.28667 21.9998 7.44314 21.1529C6.59961 20.306 6.59961 18.9429 6.59961 16.2167V11.3974Z"
                      fill="currentColor"
                    />
                    <path
                      opacity="0.5"
                      d="M4.17157 3.17157C3 4.34315 3 6.22876 3 10V12C3 15.7712 3 17.6569 4.17157 18.8284C4.78913 19.446 5.6051 19.738 6.79105 19.8761C6.59961 19.0353 6.59961 17.8796 6.59961 16.2167V11.3974C6.59961 8.6712 6.59961 7.3081 7.44314 6.46118C8.28667 5.61426 9.64432 5.61426 12.3596 5.61426H15.2396C16.8915 5.61426 18.0409 5.61426 18.8777 5.80494C18.7403 4.61146 18.4484 3.79154 17.8284 3.17157C16.6569 2 14.7712 2 11 2C7.22876 2 5.34315 2 4.17157 3.17157Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
                <div className="h-full" style={{ width: 2, backgroundColor: '#2f3332', opacity: 0.45 }} />
                <button
                  type="button"
                  className="flex-1 h-full flex items-center justify-center"
                  style={{ color: 'rgba(243,238,213,0.75)' }}
                  aria-label="Close"
                  onClick={onClose}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" viewBox="0 0 24 24">
                    <path
                      opacity="0.5"
                      d="M22.75 5C22.75 4.58579 22.4142 4.25 22 4.25C21.5858 4.25 21.25 4.58579 21.25 5V19C21.25 19.4142 21.5858 19.75 22 19.75C22.4142 19.75 22.75 19.4142 22.75 19V5Z"
                      fill="currentColor"
                    />
                    <path
                      d="M16.6598 14.6474C18.4467 13.4935 18.4467 10.5065 16.6598 9.35258L5.87083 2.38548C4.13419 1.26402 2 2.72368 2 5.0329V18.9671C2 21.2763 4.13419 22.736 5.87083 21.6145L16.6598 14.6474Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
