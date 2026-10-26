import React from 'react';

export interface GlassTitleCardProps {
  title: string;
  image: string;
  blurImage?: string;
  fontFamily?: string;
  className?: string;
  fullScreen?: boolean;
  onClick?: () => void;
}

/**
 * Lightweight, zero-overhead card component (Glass morph and RAF watchdog removed for performance).
 */
export function GlassTitleCard({
  title,
  image,
  className = '',
  fullScreen = false,
  onClick,
}: GlassTitleCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative w-full overflow-hidden ${
        fullScreen ? 'h-screen' : 'h-64 sm:h-80 md:h-96'
      } ${className} cursor-pointer select-none`}
    >
      <img
        src={image}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover scale-100 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
      <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
        <h2 className="text-4xl sm:text-6xl md:text-8xl font-display font-black tracking-tight text-white uppercase drop-shadow-xl">
          {title}
        </h2>
      </div>
    </div>
  );
}
