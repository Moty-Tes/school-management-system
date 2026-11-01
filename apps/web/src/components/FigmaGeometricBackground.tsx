'use client';

import React from 'react';

/**
 * FigmaGeometricBackground
 * 
 * Recreates high-fidelity geometric vectors rotated at -69.46deg,
 * using the custom brand palette:
 * - Deep Navy: #1B4F8C
 * - Vibrant Orange: #E86524
 */
export function FigmaGeometricBackground({
  children,
}: {
  children?: React.ReactNode;
  showBadges?: boolean;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0A1A2F] text-slate-100 selection:bg-[#E86524] selection:text-white">
      {/* ============================================================
          BASE AMBIENT GRADIENTS & TEXTURE
          ============================================================ */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden max-w-full"
        aria-hidden="true"
      >
        {/* Deep navy foundation with subtle vignette */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 15% 15%, #1B4F8C 0%, #0D2440 45%, #071322 100%)',
          }}
        />

        {/* Ambient warm orange illumination in the top/right quadrant */}
        <div 
          className="absolute -top-[20%] -right-[10%] w-[900px] h-[900px] rounded-full blur-[140px] opacity-25 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #E86524 0%, rgba(232, 101, 36, 0) 70%)',
          }}
        />

        {/* Ambient deep navy glow in bottom-left */}
        <div 
          className="absolute -bottom-[20%] -left-[10%] w-[1000px] h-[1000px] rounded-full blur-[160px] opacity-40 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #1B4F8C 0%, rgba(27, 79, 140, 0) 70%)',
          }}
        />

        {/* Subtle grid pattern overlay for architectural feel */}
        <div 
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        {/* ============================================================
            GEOMETRIC ANGLED SHAPES
            ============================================================ */}
        <div
          className="absolute origin-top-left pointer-events-none"
          style={{
            width: '2621.46px',
            height: '2619.26px',
            left: 'clamp(-400px, 15vw, 291.19px)',
            top: '-538.61px',
          }}
        >
          {/* Vector 1 - Deep Navy Polygon (#1B4F8C) */}
          <div
            className="absolute transition-all duration-700 ease-out"
            style={{
              left: '-14.73%',
              right: '6.03%',
              top: '-19.64%',
              bottom: '5.04%',
              background: 'linear-gradient(145deg, #1B4F8C 0%, #153E6E 40%, #0F2D52 80%, #091C33 100%)',
              transform: 'rotate(-69.46deg)',
              borderRadius: '96px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 50px 140px -30px rgba(7, 19, 34, 0.8), inset 0 2px 8px rgba(255, 255, 255, 0.12)',
              opacity: 0.96,
            }}
          >
            {/* Inner specular highlight line */}
            <div 
              className="absolute inset-x-0 top-0 h-40 rounded-t-[96px] opacity-20 pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 100%)',
              }}
            />
          </div>

          {/* Vector 2 - Vibrant Orange Accent Polygon (#E86524) */}
          <div
            className="absolute transition-all duration-700 ease-out"
            style={{
              left: '-14.73%',
              right: '6.03%',
              top: '-19.64%',
              bottom: '5.04%',
              background: 'linear-gradient(135deg, rgba(232, 101, 36, 0.92) 0%, rgba(214, 86, 22, 0.88) 45%, rgba(181, 66, 10, 0.82) 100%)',
              transform: 'rotate(-69.46deg) scale(0.94) translate(80px, -45px)',
              borderRadius: '84px',
              border: '1.5px solid rgba(255, 255, 255, 0.25)',
              boxShadow: '0 40px 120px -20px rgba(232, 101, 36, 0.48), inset 0 2px 12px rgba(255, 255, 255, 0.3)',
              opacity: 0.88,
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Luminous sheen across the orange blade */}
            <div 
              className="absolute inset-0 rounded-[84px] pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 60%)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Page Content Slot */}
      <div className="relative z-10 w-full min-h-screen">
        {children}
      </div>
    </div>
  );
}

export default FigmaGeometricBackground;
