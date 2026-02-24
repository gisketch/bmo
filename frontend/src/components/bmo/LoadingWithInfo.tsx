import { useEffect, useMemo, useState } from 'react';

interface LoadingWithInfoProps {
  text?: string;
}

export default function LoadingWithInfo({ text = 'Loading' }: LoadingWithInfoProps) {
  const [dotCount, setDotCount] = useState(1);
  const [visibleChars, setVisibleChars] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 350);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setVisibleChars(0);
    const intervalId = window.setInterval(() => {
      setVisibleChars((prev) => {
        if (prev >= text.length) {
          window.clearInterval(intervalId);
          return prev;
        }
        return prev + 1;
      });
    }, 28);

    return () => window.clearInterval(intervalId);
  }, [text]);

  const dots = useMemo(() => '.'.repeat(dotCount), [dotCount]);

  return (
    <div className="w-full h-full flex items-center justify-center px-10">
      <div
        className="text-center text-2xl"
        style={{ fontFamily: 'Pixeloid', color: '#0A3A2E' }}
      >
        {text.slice(0, visibleChars)}
        <span aria-hidden="true">{dots}</span>
      </div>
    </div>
  );
}
