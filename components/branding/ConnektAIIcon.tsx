'use client';

import React from 'react';

interface ConnektIconProps {
    className?: string;
}

export default function ConnektAIIcon({ className = 'w-6 h-6' }: ConnektIconProps) {
    return (
        <div className={`${className} flex items-center justify-center`}>
            <style jsx>{`
        .ai-icon {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .ai-path {
          fill: transparent;
          stroke: #0d9488;
          stroke-width: 2px;
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: 
            ai-draw 2.2s ease-in-out forwards,
            ai-fill 0.6s 2s ease-in-out forwards;
        }

        @keyframes ai-draw {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes ai-fill {
          from {
            fill: transparent;
            stroke-width: 2px;
          }
          to {
            fill: #0d9488;
            stroke-width: 0;
          }
        }
      `}</style>
            <svg className="ai-icon" viewBox="50 50 412 412" xmlns="http://www.w3.org/2000/svg">
                <path
                    className="ai-path"
                    transform="translate(64, 64)"
                    d="M320,64 L320,320 L64,320 L64,64 L320,64 Z M171.749388,128 L146.817842,128 L99.4840387,256 L121.976629,256 L130.913039,230.977 L187.575039,230.977 L196.319607,256 L220.167172,256 L171.749388,128 Z M260.093778,128 L237.691519,128 L237.691519,256 L260.093778,256 L260.093778,128 Z M159.094727,149.47526 L181.409039,213.333 L137.135039,213.333 L159.094727,149.47526 Z M341.333333,256 L384,256 L384,298.666667 L341.333333,298.666667 L341.333333,256 Z M85.3333333,341.333333 L128,341.333333 L128,384 L85.3333333,384 L85.3333333,341.333333 Z M170.666667,341.333333 L213.333333,341.333333 L213.333333,384 L170.666667,384 L170.666667,341.333333 Z M85.3333333,0 L128,0 L128,42.6666667 L85.3333333,42.6666667 L85.3333333,0 Z M256,341.333333 L298.666667,341.333333 L298.666667,384 L256,384 L256,341.333333 Z M170.666667,0 L213.333333,0 L213.333333,42.6666667 L170.666667,42.6666667 L170.666667,0 Z M256,0 L298.666667,0 L298.666667,42.6666667 L256,42.6666667 L256,0 Z M341.333333,170.666667 L384,170.666667 L384,213.333333 L341.333333,213.333333 L341.333333,170.666667 Z M0,256 L42.6666667,256 L42.6666667,298.666667 L0,298.666667 L0,256 Z M341.333333,85.3333333 L384,85.3333333 L384,128 L341.333333,128 L341.333333,85.3333333 Z M0,170.666667 L42.6666667,170.666667 L42.6666667,213.333333 L0,213.333333 L0,170.666667 Z M0,85.3333333 L42.6666667,85.3333333 L42.6666667,128 L0,128 L0,85.3333333 Z"
                />
            </svg>
        </div>
    );
}