
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
    <rect width="512" height="512" rx="120" fill="#030712"/>
    <circle cx="256" cy="256" r="190" stroke="#FBBF24" strokeWidth="24" strokeOpacity="0.8"/>
    <path d="M256 70C256 70 320 180 350 210C380 240 430 240 430 240C430 240 390 280 360 290C330 300 300 280 256 420C212 280 182 300 152 290C122 280 82 240 82 240C82 240 132 240 162 210C192 180 256 70 256 70Z" fill="url(#leaf_gradient_logo)"/>
    <path d="M256 420V460" stroke="#FBBF24" strokeWidth="24" strokeLinecap="round"/>
    <defs>
      <linearGradient id="leaf_gradient_logo" x1="256" y1="70" x2="256" y2="420" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10B981"/>
        <stop offset="1" stopColor="#065F46"/>
      </linearGradient>
    </defs>
  </svg>
);
