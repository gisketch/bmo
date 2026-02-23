import { useEffect, useMemo, useRef, useState } from 'react';

interface ModalStickerPaperProps {
  className?: string;
  text: string;
}

export default function ModalStickerPaper({ className, text }: ModalStickerPaperProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [fontPx, setFontPx] = useState<number>(18);
  const paddingPx = 8;

  const textFactor = useMemo(() => {
    const safeLen = Math.max(1, text.length);
    return safeLen;
  }, [text]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const innerW = Math.max(0, width - paddingPx * 2);
      const innerH = Math.max(0, height - paddingPx * 2);

      const byHeight = innerH * 0.9;
      const byWidth = (innerW / textFactor) * 1.8;
      const next = Math.max(10, Math.min(byHeight, byWidth));
      setFontPx(next);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [textFactor]);

  return (
    <div
      className={`w-full overflow-hidden ${className ?? ''}`}
      style={{
        backgroundColor: '#F3EED5',
        backgroundImage:
          'repeating-linear-gradient(to bottom, rgba(0,0,0,0.08) 0, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 7px)',
        display: 'flex',
        alignItems: 'stretch',
      }}
    >
      <div className="shrink-0 flex items-stretch">
        <div className="h-full" style={{ width: 32, backgroundColor: 'rgba(63, 212, 182, 0.55)' }} />
        <div style={{ width: 8 }} />
        <div className="h-full" style={{ width: 14, backgroundColor: 'rgba(169, 252, 228, 0.6)' }} />
        <div style={{ width: 14 }} />
      </div>
      <div
        ref={ref}
        className="flex-1"
        style={{
          padding: paddingPx,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"Nanum Pen Script", cursive',
          fontSize: `${fontPx}px`,
          lineHeight: 1,
          color: 'rgba(0,0,0,0.45)',
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>
      <div className="shrink-0 flex items-stretch">
        <div style={{ width: 14 }} />
        <div className="h-full" style={{ width: 14, backgroundColor: 'rgba(169, 252, 228, 0.6)' }} />
        <div style={{ width: 8 }} />
        <div className="h-full" style={{ width: 32, backgroundColor: 'rgba(63, 212, 182, 0.55)' }} />
      </div>
    </div>
  );
}
