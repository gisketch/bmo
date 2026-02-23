import { LedState, LED_COLORS } from '../../types/bmo';
import Cassette from './Cassette';

interface FirstRowProps {
  className?: string;
  ledState?: LedState;
  /** Normalized volume 0–1 for glow intensity (talking/listening states) */
  glowIntensity?: number;
  cassetteTitle?: string;
  cassetteAnimation?: 'insert' | 'eject';
  onCassettePress?: () => void;
}

/**
 * FirstRow — Horizontal row below the Screen containing the cassette slot and LED indicator.
 */
export default function FirstRow({
  className,
  ledState = LedState.Offline,
  glowIntensity = 0,
  cassetteTitle,
  cassetteAnimation,
  onCassettePress,
}: FirstRowProps) {
  const colors = LED_COLORS[ledState];
  const hasGlow = ledState === LedState.Talking;
  const spread = hasGlow ? Math.round(4 + glowIntensity * 12) : 0;
  const blur = hasGlow ? Math.round(8 + glowIntensity * 16) : 0;
  return (
    <div className={`flex flex-row items-center gap-4 w-full px-2 ${className ?? ''}`}>
      {/* Cassette Slot — wide squircle with inset depth */}
      <div
        className="relative flex-1 h-10 rounded-lg mr-16"
        style={{ backgroundColor: '#0A3A2E' }}
      >
        <div
          className="absolute inset-x-0 bottom-0 rounded-lg z-10"
          style={{ top: '50%', backgroundColor: '#0D4538' }}
        />
        {cassetteTitle ? (
          <Cassette
            title={cassetteTitle}
            onPress={onCassettePress}
            animate={cassetteAnimation}
          />
        ) : null}
      </div>

      {/* LED Indicator — color and glow driven by agent state */}
      <div
        className="w-10 h-10 rounded-full transition-all duration-150"
        style={{
          backgroundColor: colors.base,
          boxShadow: hasGlow
            ? `0 0 ${blur}px ${spread}px ${colors.glow}`
            : '0 4px 0 0 rgba(13, 81, 66, 0.5)',
        }}
      />
    </div>
  );
}
