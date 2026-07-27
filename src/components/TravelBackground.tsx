import { useMemo } from 'react';
import { Plane, Cloud, Sparkles } from 'lucide-react';

/**
 * Animated travel background: drifting clouds, flying airplanes,
 * floating AI particles, aurora gradients, and a subtle grid.
 * Used on landing + auth screens. Purely decorative.
 */
export function TravelBackground({ variant = 'full' }: { variant?: 'full' | 'subtle' }) {
  const clouds = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        top: 8 + i * 14,
        size: 60 + i * 18,
        duration: 35 + i * 8,
        delay: i * 4,
        opacity: 0.08 + (i % 3) * 0.04,
      })),
    [],
  );

  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: (i * 53) % 100,
        y: (i * 37) % 100,
        size: 2 + (i % 4),
        duration: 5 + (i % 5),
        delay: (i % 6) * 0.7,
      })),
    [],
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Aurora base */}
      <div className="absolute inset-0 bg-hero-aurora" />
      <div className="absolute inset-0 bg-radial-glow" />

      {/* Grid */}
      <div
        className="absolute inset-0 bg-grid-glow opacity-[0.4]"
        style={{ backgroundSize: '48px 48px' }}
      />

      {/* Floating orbs */}
      <div className="absolute -top-40 -left-20 w-96 h-96 rounded-full bg-ai-500/20 blur-[120px] animate-pulse-glow" />
      <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-glow-cyan/15 blur-[140px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      <div className="absolute -bottom-40 left-1/3 w-[26rem] h-[26rem] rounded-full bg-glow-teal/10 blur-[130px] animate-pulse-glow" style={{ animationDelay: '3s' }} />

      {variant === 'full' && (
        <>
          {/* Clouds */}
          {clouds.map((c) => (
            <div
              key={c.id}
              className="absolute animate-drift"
              style={{
                top: `${c.top}%`,
                animationDuration: `${c.duration}s`,
                animationDelay: `-${c.delay}s`,
                opacity: c.opacity,
              }}
            >
              <Cloud style={{ width: c.size, height: c.size }} className="text-slate-300" fill="currentColor" />
            </div>
          ))}

          {/* Airplanes */}
          <div className="absolute top-[18%] left-0 animate-fly text-ai-300" style={{ filter: 'drop-shadow(0 0 8px rgba(43,107,255,0.5))' }}>
            <Plane className="w-8 h-8" fill="currentColor" />
          </div>
          <div className="absolute top-[68%] left-0 animate-fly-reverse text-glow-cyan/70" style={{ animationDelay: '-8s', filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.4))' }}>
            <Plane className="w-6 h-6" fill="currentColor" />
          </div>
          <div className="absolute top-[42%] left-0 animate-fly text-glow-teal/50" style={{ animationDelay: '-16s' }}>
            <Plane className="w-5 h-5" fill="currentColor" />
          </div>

          {/* AI particles */}
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full bg-ai-400/60 animate-float"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
                boxShadow: '0 0 8px rgba(43,107,255,0.6)',
              }}
            />
          ))}

          {/* Sparkle accents */}
          <Sparkles className="absolute top-[30%] left-[15%] w-5 h-5 text-ai-300/40 animate-pulse-glow" />
          <Sparkles className="absolute top-[60%] right-[20%] w-4 h-4 text-glow-cyan/40 animate-pulse-glow" style={{ animationDelay: '2s' }} />
        </>
      )}

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-950/60" />
    </div>
  );
}
