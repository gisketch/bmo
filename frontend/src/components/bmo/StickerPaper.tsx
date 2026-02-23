import { useEffect, useMemo, useRef, useState } from 'react';

interface StickerPaperProps {
  className?: string;
  style?: React.CSSProperties;
  text?: string;
}

export default function StickerPaper({ className, style, text = 'For Ghegi' }: StickerPaperProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [fontPx, setFontPx] = useState<number>(18);
  const paddingPx = 6;

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
      ref={ref}
      className={`absolute rounded-md ${className ?? ''}`}
      style={{
        backgroundColor: '#F3EED5',
        backgroundImage:
          'repeating-linear-gradient(to bottom, rgba(0,0,0,0.08) 0, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 7px)',
        ...style,
      }}
    >
      <div
        className="w-full h-full"
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
    </div>
  );
}
