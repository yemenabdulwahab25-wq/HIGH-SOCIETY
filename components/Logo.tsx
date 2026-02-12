
import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className }) => (
  <svg 
    viewBox="0 0 512 512" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    aria-label="Billionaire Level Logo"
  >
    <rect width="512" height="512" rx="100" fill="#030712"/>
    <circle cx="256" cy="256" r="200" stroke="#FBBF24" strokeWidth="8" strokeOpacity="0.3"/>
    <path d="M256 60C256 60 310 170 340 200C370 230 420 230 420 230C420 230 380 270 350 280C320 290 290 270 256 410C222 270 192 290 162 280C132 270 92 230 92 230C92 230 142 230 172 200C202 170 256 60 256 60Z" fill="url(#leaf_gradient_logo)"/>
    <path d="M256 410V450" stroke="#FBBF24" strokeWidth="12" strokeLinecap="round"/>
    <defs>
      <linearGradient id="leaf_gradient_logo" x1="256" y1="60" x2="256" y2="410" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10B981"/>
        <stop offset="1" stopColor="#047857"/>
      </linearGradient>
    </defs>
  </svg>
);
