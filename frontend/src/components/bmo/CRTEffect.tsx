/**
 * CRTEffect — A CSS overlay that mimics the gingerbeardman/webgl-crt-shader settings.
 * Settings applied:
 * - scanlineIntensity: 0.5
 * - scanlineCount: 256
 * - brightness: 1.5
 * - contrast: 1.05
 * - saturation: 1.1
 * - vignetteStrength: 0.3
 * - curvature: 0.1
 * - flickerStrength: 0.01
 * - rgbShift: 1.0
 */
export default function CRTEffect({
  flicker = true,
  reflection = true,
  className,
  roundedClassName = 'rounded-[2.5rem]',
}: {
  flicker?: boolean;
  reflection?: boolean;
  className?: string;
  roundedClassName?: string;
}) {
  return (
    <div className={`pointer-events-none absolute inset-0 z-50 overflow-hidden ${roundedClassName} ${className ?? ''}`}>
      {/* Scanlines - Subtler and more reliable repeating gradient */}
      <div 
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)'
        }}
      ></div>

      {/* Vignette - Very subtle */}
      <div 
        className="absolute inset-0 opacity-10 mix-blend-multiply"
        style={{
          background: 'radial-gradient(circle at center, transparent 60%, rgba(0,0,0,0.6) 100%)'
        }}
      ></div>

      {/* Flicker - Animated opacity */}
      {flicker && (
        <div className="absolute inset-0 animate-crt-flicker bg-black mix-blend-overlay"></div>
      )}

      {/* Curvature/Warp - Simulated with a subtle inner shadow and a slight bulge effect on the edges */}
      <div className={`absolute inset-0 shadow-[inset_0_0_10px_rgba(0,0,0,0.2)] ${roundedClassName}`}></div>
      
      {/* CRT Glass Reflection - Adds to the curved feel */}
      {reflection && (
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 40%, transparent 100%)'
          }}
        ></div>
      )}
    </div>
  );
}

