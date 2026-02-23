import StickerPaper from './StickerPaper';

interface CassetteProps {
  className?: string;
}

export default function Cassette({ className }: CassetteProps) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className ?? ''}`}>
      <div
        className="absolute overflow-hidden rounded-lg z-20"
        style={{ left: 6, right: 6, top: 0, bottom: 0 }}
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
      <div
        className="absolute rounded-lg z-30 overflow-hidden"
        style={{
          left: 6,
          right: 6,
          top: 0,
          bottom: 0,
          backgroundColor: '#3f4443',
          transform: 'translateY(-10px)',
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
  );
}
