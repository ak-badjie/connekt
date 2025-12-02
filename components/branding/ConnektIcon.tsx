'use client';

import React from 'react';

interface ConnektIconProps {
  className?: string;
}

export default function ConnektIcon({ className = '' }: ConnektIconProps) {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <style jsx>{`
        .briefcase-icon {
          width: 100%;
          height: 100%;
          display: block;
          overflow: visible; 
        }

        .briefcase-path {
          fill: none; 
          stroke: #009688; 
          stroke-width: 0.5px; 
          stroke-linecap: round;  
          stroke-linejoin: round; 
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: 
            draw 2s ease-in-out forwards,
            thicken 0.5s 1.8s ease-in-out forwards;
        }

        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }
       
        @keyframes thicken {
          from {
            stroke-width: 0.5px;
          }
          to {
            stroke-width: 2px; 
          }
        }
      `}</style>
      <svg className="briefcase-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect className="briefcase-path" x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path className="briefcase-path" d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
      </svg>
    </div>
  );
}