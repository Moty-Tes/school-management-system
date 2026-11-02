'use client';

import React from 'react';

/**
 * Institutional Geometric Background
 * 
 * Calm, high-contrast, modern architectural canvas:
 * - Primary Anchor: Deep Institutional Navy (#0A192F / #0D2340)
 * - Restrained Accent: Solar Orange (#E86524) as focused ambient illumination
 * - Responsive: 100% viewport contained with zero horizontal overflow risks
 */
export function FigmaGeometricBackground({
  children,
  showBadges,
}: {
  children?: React.ReactNode;
  showBadges?: boolean;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#071322] text-slate-100 selection:bg-[#E86524] selection:text-white">
      {/* Ambient Lighting & Micro-Grid Overlay */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden max-w-full"
        aria-hidden="true"
      >
        {/* Base Radial Gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 20%, #0F2D52 0%, #0A1E37 45%, #06111E 100%)',
          }}
        />

        {/* Ambient Warm Accent Glow (Top Right) */}
        <div 
          className="absolute -top-[15%] -right-[10%] w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] rounded-full blur-[140px] opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #E86524 0%, rgba(232, 101, 36, 0) 70%)',
          }}
        />

        {/* Deep Navy Soft Bloom (Bottom Left) */}
        <div 
          className="absolute -bottom-[20%] -left-[10%] w-[700px] sm:w-[900px] h-[700px] sm:h-[900px] rounded-full blur-[160px] opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #1B4F8C 0%, rgba(27, 79, 140, 0) 70%)',
          }}
        />

        {/* Precision Micro-Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Subtle Horizontal Horizon Rule */}
        <div className="absolute top-[35%] inset-x-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>

      {/* Main Content Slot */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
}

export default FigmaGeometricBackground;
