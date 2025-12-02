'use client';

import React from 'react';

interface ConnektIconProps {
    className?: string;
}

export default function ConnektMailIcon({ className = 'w-6 h-6' }: ConnektIconProps) {
    return (
        <div className={`${className} flex items-center justify-center`}>
            <style jsx>{`
        .mail-icon {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .mail-path {
          fill: transparent;
          stroke: #0d9488;
          stroke-width: 0.5px;
          stroke-dasharray: 300;
          stroke-dashoffset: 300;
          animation: 
            mail-draw 2s ease-in-out forwards,
            mail-fill 0.6s 1.8s ease-in-out forwards;
        }

        @keyframes mail-draw {
          to { stroke-dashoffset: 0; }
        }

        @keyframes mail-fill {
          from { fill: transparent; stroke-width: 0.5px; }
          to { fill: #0d9488; stroke-width: 0; }
        }
      `}</style>
            <svg className="mail-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path className="mail-path" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
        </div>
    );
}