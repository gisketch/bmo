import StickerPaper from './StickerPaper';

interface CassetteProps {
  className?: string;
  title: string;
  onPress?: () => void;
  animate?: 'insert' | 'eject';
}

export default function Cassette({ className, title, onPress, animate }: CassetteProps) {
  const shouldAnimate = animate === 'insert' || animate === 'eject';
  const transformStyle = shouldAnimate ? undefined : 'translateY(-10px)';

  const movementClassName =
    animate === 'insert'
      ? 'animate-cassette-insert'
      : animate === 'eject'
        ? 'animate-cassette-eject'
        : 'transition-transform duration-150 ease-out';

  return (
    <div 
      className={`absolute inset-0 ${className ?? ''}`}
      onClick={onPress}
      style={{ cursor: onPress ? 'pointer' : 'default' }}
    >
      <div
        className="absolute overflow-hidden rounded-lg z-20"
        style={{ left: 6, right: 6, top: 0, bottom: 0 }}
      >
        <div
          className={`absolute inset-0 rounded-lg ${movementClassName}`}
          style={{ transform: transformStyle }}
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
          className={`absolute rounded-lg ${movementClassName}`}
          style={{
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            transform: transformStyle,
          }}
        >
          <div
            className="absolute inset-0 rounded-lg"
            style={{ backgroundColor: '#2f3332', transform: 'translateY(4px)' }}
          />
          <div
            className="absolute inset-0 rounded-lg overflow-hidden"
            style={{ backgroundColor: '#3f4443' }}
          >
            <StickerPaper
              style={{
                left: 12,
                right: 80,
                height: 32,
                top: -4,
                transform: 'rotate(-2deg)',
              }}
              text={title}
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
    </div>
  );
}
