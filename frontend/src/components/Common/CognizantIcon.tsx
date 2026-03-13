import React from 'react';

interface CognizantIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export function CognizantIcon({ size = 24, color: _color = 'currentColor', strokeWidth: _strokeWidth = 2, className }: CognizantIconProps) {
  const normalizedColor = String(_color).toLowerCase().trim();
  const useLightVariant = ['#fff', '#ffffff', 'white'].includes(normalizedColor);

  return (
    <img
      src="/cts.png"
      alt="Cognizant"
      width={size}
      height={size}
      className={className}
      style={{
        objectFit: 'contain',
        // Make logo visible on dark/blue backgrounds (e.g., PDF header avatar).
        filter: useLightVariant ? 'brightness(0) invert(1)' : 'none',
      }}
    />
  );
}
