import React from "react";

/**
 * Premium Bakery-themed Loader Component.
 * Supports three variants:
 * - "inline": Small, fast spinning indicator (ideal for buttons).
 * - "section": Medium card-based loader with rolling-pin animation.
 * - "fullScreen": Frosted-glass backdrop overlay with full rolling-pin animation and text.
 */
export default function Loader({ variant = "section", text = "Baking delicious data..." }) {
  // Inline styling for self-contained, robust animations
  const styles = `
    @keyframes rolling-pin-action {
      0%, 100% {
        transform: translate(12px, 0) rotate(15deg);
      }
      50% {
        transform: translate(-12px, 0) rotate(-345deg);
      }
    }
    @keyframes dough-stretch {
      0%, 100% {
        transform: scaleY(1.0) scaleX(1.0);
      }
      50% {
        transform: scaleY(0.7) scaleX(1.12);
      }
    }
    @keyframes steam-drift {
      0% {
        transform: translateY(4px) scale(0.8);
        opacity: 0;
      }
      50% {
        opacity: 0.6;
      }
      100% {
        transform: translateY(-12px) scale(1.1);
        opacity: 0;
      }
    }
    @keyframes pulse-light {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    .anim-rolling-pin {
      transform-origin: 50% 50%;
      animation: rolling-pin-action 2s ease-in-out infinite;
    }
    .anim-dough {
      transform-origin: 50% 100%;
      animation: dough-stretch 2s ease-in-out infinite;
    }
    .anim-steam-1 {
      transform-origin: 50% 100%;
      animation: steam-drift 2s ease-in-out infinite;
    }
    .anim-steam-2 {
      transform-origin: 50% 100%;
      animation: steam-drift 2s ease-in-out infinite 0.7s;
    }
    .anim-steam-3 {
      transform-origin: 50% 100%;
      animation: steam-drift 2s ease-in-out infinite 1.4s;
    }
    .anim-pulse-text {
      animation: pulse-light 1.5s ease-in-out infinite;
    }
  `;

  if (variant === "inline") {
    return (
      <span className="inline-flex items-center justify-center">
        <svg
          className="animate-spin h-5 w-5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </span>
    );
  }

  const loaderContent = (
    <div className="flex flex-col items-center justify-center p-6 text-center select-none">
      <style>{styles}</style>
      
      {/* Interactive Baking Animation SVG */}
      <svg
        viewBox="0 0 140 100"
        className="w-36 h-28 mb-4 filter drop-shadow-md"
      >
        {/* Steam / Baking Aroma rising */}
        <path
          d="M60,28 Q63,22 60,16"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="anim-steam-1"
        />
        <path
          d="M70,26 Q67,20 70,14"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="anim-steam-2"
        />
        <path
          d="M80,28 Q83,22 80,16"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="anim-steam-3"
        />

        {/* Flour Dust particles */}
        <circle cx="45" cy="40" r="1.5" fill="#E2E8F0" className="anim-pulse-text" />
        <circle cx="95" cy="43" r="1" fill="#E2E8F0" className="anim-pulse-text" />
        <circle cx="50" cy="35" r="1.2" fill="#E2E8F0" className="anim-pulse-text" />

        {/* Dough Board / Table Base */}
        <line
          x1="15"
          y1="82"
          x2="125"
          y2="82"
          stroke="#CBD5E1"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Dough being rolled - squashes and stretches in sync with rolling pin */}
        <path
          d="M 30,80 C 35,66 105,66 110,80 Z"
          fill="#FDE68A"
          stroke="#FCD34D"
          strokeWidth="1.5"
          className="anim-dough"
        />

        {/* Rolling Pin Group - rolls left & right, rotating */}
        <g className="anim-rolling-pin">
          {/* Left Handle */}
          <rect x="20" y="52" width="12" height="6" rx="2" fill="#B45309" />
          {/* Main Pin Body */}
          <rect x="32" y="47" width="76" height="16" rx="4" fill="#D97706" />
          {/* Highlight/Gloss on Pin */}
          <rect x="36" y="50" width="68" height="3" rx="1.5" fill="#FBBF24" opacity="0.3" />
          {/* Right Handle */}
          <rect x="108" y="52" width="12" height="6" rx="2" fill="#B45309" />
        </g>
      </svg>

      {/* Loading message */}
      <div className="flex flex-col items-center">
        <span className="text-fg font-semibold tracking-wide text-sm anim-pulse-text">
          {text}
        </span>
        <span className="text-xs text-fg-muted mt-1">Please wait a moment</span>
      </div>
    </div>
  );

  if (variant === "fullScreen") {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-surface/70 backdrop-blur-md transition-all duration-300">
        <div className="bg-elevated rounded-2xl shadow-2xl border border-line p-8 transform scale-100 animate-fade-in">
          {loaderContent}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-12 flex items-center justify-center">
      {loaderContent}
    </div>
  );
}
