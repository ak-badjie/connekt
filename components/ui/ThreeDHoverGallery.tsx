"use client";

import React, { useState } from "react";
import { Users, Clock } from "lucide-react";

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

// Project-specific data interface for rich content display
export interface ProjectImageData {
  src: string;
  title: string;
  shortTitle: string;
  status: 'active' | 'planning' | 'on-hold' | 'completed' | string;
  memberCount?: number;
  budget?: number;
  progress?: number;
  deadline?: string;
  description?: string;
}

export interface ThreeDHoverGalleryProps {
  images?: ProjectImageData[];
  onImageHover?: (index: number) => void;
  onImageClick?: (index: number) => void;
  height?: number | string;
  className?: string;
}

const ThreeDHoverGallery: React.FC<ThreeDHoverGalleryProps> = ({
  images = [],
  onImageHover,
  onImageClick,
  height = 380,
  className,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleMouseEnter = (index: number) => {
    setActiveIndex(index);
    onImageHover?.(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  const handleClick = (index: number) => {
    onImageClick?.(index);
  };

  if (images.length === 0) {
    return (
      <div className={cn("flex items-center justify-center text-slate-400", className)} style={{ height }}>
        No projects to display
      </div>
    );
  }

  return (
    <div
      className={cn("flex justify-center items-center gap-2 perspective-1000", className)}
      style={{ height }}
    >
      {images.map((img, i) => {
        const isActive = activeIndex === i;

        return (
          <div
            key={i}
            onMouseEnter={() => handleMouseEnter(i)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(i)}
            className={cn(
              "relative h-full transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] rounded-3xl overflow-hidden cursor-pointer border border-white/40 shadow-xl bg-slate-200",
              isActive
                ? "w-[320px] z-20 shadow-2xl shadow-teal-900/20"
                : "w-16"
            )}
            style={{ transform: 'translateZ(0)' }}
          >
            {/* Background Image */}
            <div
              className={cn(
                "absolute inset-0 bg-cover bg-center transition-transform duration-700",
                isActive && "scale-110"
              )}
              style={{ backgroundImage: `url(${img.src})` }}
            />

            {/* Overlay Gradient */}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-t from-teal-950/90 via-teal-900/40 to-transparent transition-opacity duration-300",
                isActive ? "opacity-100" : "opacity-60"
              )}
            />

            {/* Vertical Text (Collapsed state) */}
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none",
                isActive ? "opacity-0" : "opacity-100"
              )}
            >
              <span className="rotate-90 text-white font-bold tracking-widest text-sm whitespace-nowrap uppercase opacity-80">
                {img.shortTitle}
              </span>
            </div>

            {/* Content (Expanded state) */}
            <div
              className={cn(
                "absolute bottom-0 left-0 p-6 w-full transition-all duration-500 delay-100 transform",
                isActive
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              )}
            >
              {/* Status Badge */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    img.status === 'active' ? 'bg-green-400' : 'bg-amber-400'
                  )}
                />
                <span className="text-teal-100 text-xs font-bold uppercase tracking-wide">
                  {img.status}
                </span>
              </div>

              {/* Title */}
              <h4 className="text-white text-2xl font-bold leading-tight mb-2 drop-shadow-md">
                {img.title}
              </h4>

              {/* Meta Info */}
              <div className="flex items-center gap-3 text-white/80 text-xs font-medium">
                {img.memberCount !== undefined && (
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {img.memberCount} Members
                  </span>
                )}
                {img.progress !== undefined && (
                  <>
                    <span className="w-1 h-1 bg-white/40 rounded-full" />
                    <span>{img.progress}% Done</span>
                  </>
                )}
                {img.deadline && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {img.deadline}
                  </span>
                )}
                {img.budget !== undefined && (
                  <span>• ${img.budget.toLocaleString()}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ThreeDHoverGallery;
