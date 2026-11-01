'use client';

import React from 'react';

/**
 * FigmaGeometricBackground
 * 
 * Recreates Figma Frame 792765 with high-fidelity geometric vectors,
 * rotated at -69.46deg, using the user's custom brand colors:
 * - Deep Navy: #1B4F8C (replaces gray/green)
 * - Vibrant Orange: #E86524 (replaces gray/green)
 * - Typography: 'Mulish', 600 weight for "V 1.0", 800 weight for "FREE"
 * - Frame 792769: 242px x 242px "FREE" badge
 */
export function FigmaGeometricBackground({
  children,
  showBadges = true,
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
        className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden"
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

        {/* Subtle grid pattern overlay for precision architectural feel */}
        <div 
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        {/* ============================================================
            FIGMA FRAME 792765
            width: 2621.46px; height: 2619.26px; left: 291.19px; top: -538.61px;
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
          {/* position: absolute; left: -14.73%; right: 6.03%; top: -19.64%; bottom: 5.04%; transform: rotate(-69.46deg); */}
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
          {/* Replaces the duplicate vector with the requested #E86524 accent */}
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

          {/* V 1.0 Label from Figma */}
          {/* left: 14.6%; right: 81.51%; top: 57.52%; bottom: 40.46%; font-family: 'Mulish'; font-weight: 600; font-size: 42px; line-height: 53px; color: #FFFFFF; */}
          {showBadges && (
            <div
              className="absolute z-10 flex items-center justify-center select-none"
              style={{
                left: '14.6%',
                right: '81.51%',
                top: '57.52%',
                bottom: '40.46%',
                fontFamily: "'Mulish', var(--font-mulish), system-ui, sans-serif",
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '42px',
                lineHeight: '53px',
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                textShadow: '0 4px 24px rgba(0, 0, 0, 0.5), 0 0 12px rgba(232, 101, 36, 0.4)',
              }}
            >
              <div className="flex items-center gap-3 px-6 py-2 rounded-2xl bg-[#0A1A2F]/60 border border-white/15 backdrop-blur-md shadow-2xl">
                <span className="w-3 h-3 rounded-full bg-[#E86524] animate-ping" />
                <span>V 1.0</span>
              </div>
            </div>
          )}

          {/* Frame 792769 */}
          {/* width: 242px; height: 242px; left: 463.81px; top: 1188.61px; */}
          {/* FREE Badge: Mulish 800 weight, 53.4947px */}
          {showBadges && (
            <div
              className="absolute rounded-[40px] flex items-center justify-center p-3 shadow-2xl border border-white/30 select-none group"
              style={{
                width: '242px',
                height: '242px',
                left: '463.81px',
                top: '1188.61px',
                background: 'linear-gradient(135deg, #FF7B39 0%, #E86524 50%, #C44C11 100%)',
                boxShadow: '0 30px 80px -15px rgba(232, 101, 36, 0.65), 0 0 40px rgba(232, 101, 36, 0.35), inset 0 2px 10px rgba(255, 255, 255, 0.45)',
              }}
            >
              {/* Inner decorative image 1 emblem ring */}
              <div 
                className="absolute inset-3 rounded-[32px] border border-white/40 border-dashed pointer-events-none opacity-80"
                style={{
                  animation: 'spin 40s linear infinite',
                }}
              />
              <div className="absolute inset-5 rounded-[26px] bg-gradient-to-br from-white/20 via-transparent to-black/20 pointer-events-none" />

              {/* FREE Text */}
              {/* left: 23.16%; right: 21.88%; top: 35.79%; bottom: 36.52%; font-family: 'Mulish'; font-weight: 800; font-size: 53.4947px; line-height: 67px; color: #FFFFFF; */}
              <div
                className="relative z-10 flex flex-col items-center justify-center text-center font-extrabold"
                style={{
                  fontFamily: "'Mulish', var(--font-mulish), system-ui, sans-serif",
                  fontWeight: 800,
                  fontSize: '53.4947px',
                  lineHeight: '67px',
                  color: '#FFFFFF',
                  letterSpacing: '0.04em',
                  textShadow: '0 6px 18px rgba(0, 0, 0, 0.35)',
                }}
              >
                <span>FREE</span>
                <span className="text-[12px] font-bold tracking-widest uppercase opacity-90 text-white/95 mt-[-4px]">
                  EDITION
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Responsive mobile / tablet floating badge indicator */}
        {showBadges && (
          <div className="lg:hidden absolute top-4 right-4 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1B4F8C]/80 border border-white/20 backdrop-blur-md shadow-lg pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-[#E86524]" />
            <span 
              className="text-xs font-bold text-white tracking-wider"
              style={{ fontFamily: "'Mulish', var(--font-mulish), sans-serif" }}
            >
              V 1.0 <span className="text-[#E86524] ml-1">FREE</span>
            </span>
          </div>
        )}
      </div>

      {/* Main Page Content Slot */}
      <div className="relative z-10 w-full min-h-screen">
        {children}
      </div>
    </div>
  );
}

export default FigmaGeometricBackground;
