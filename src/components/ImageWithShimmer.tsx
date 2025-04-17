import React, { useState } from "react";

interface ImageWithShimmerProps {
  src: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
}

export const ImageWithShimmer: React.FC<ImageWithShimmerProps> = ({ src, alt = "", className = "", onClick }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={`h-48 overflow-hidden cursor-pointer relative bg-gray-200 ${className}`}
      onClick={onClick}
      aria-label={alt}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (onClick && (e.key === "Enter" || e.key === " ")) onClick();
      }}
    >
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 z-10" />
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-transform duration-500 hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
        draggable={false}
      />
    </div>
  );
};
