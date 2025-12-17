'use client';

import React from 'react';

interface ConnektStorageIconProps {
    className?: string;
}

export default function ConnektStorageIcon({ className = 'w-6 h-6' }: ConnektStorageIconProps) {
    return (
        <div className={`${className} flex items-center justify-center`}>
            <style jsx>{`
                .storage-icon {
                    width: 100%;
                    height: 100%;
                    overflow: visible;
                }

                .dbOutline {
                    fill: none;
                    stroke: #0d9488;
                    stroke-width: 0.5px;
                    stroke-miterlimit: 10;
                    stroke-dasharray: 200;
                    stroke-dashoffset: 200;
                    animation: drawStructure 2s ease-in-out forwards;
                }

                .dbFill {
                    fill: #0d9488;
                    opacity: 1;
                    clip-path: inset(100% 0 0 0);
                    animation: fillData 1.5s cubic-bezier(0.4, 0.0, 0.2, 1) 1.5s forwards;
                }

                .dbSheen {
                    fill: rgba(255, 255, 255, 0.3);
                    clip-path: inset(100% 0 0 0);
                    animation: shineSweep 3s ease-in-out infinite 3.5s;
                }

                @keyframes drawStructure {
                    to {
                        stroke-dashoffset: 0;
                    }
                }

                @keyframes fillData {
                    0% {
                        clip-path: inset(100% 0 0 0);
                    }

                    100% {
                        clip-path: inset(0% 0 0 0);
                    }
                }

                @keyframes shineSweep {
                    0% {
                        clip-path: inset(100% 0 0 0);
                    }

                    50% {
                        clip-path: inset(0 0 100% 0);
                    }

                    51% {
                        clip-path: inset(100% 0 0 0);
                    }

                    100% {
                        clip-path: inset(100% 0 0 0);
                    }
                }
            `}</style>

            <svg
                className="storage-icon"
                viewBox="0 0 36 36"
                preserveAspectRatio="xMidYMid meet"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <path
                        id="storage-path"
                        d="M17.91,18.28c8.08,0,14.66-1.74,15.09-3.94V8.59c-.43,2.2-7,3.94-15.09,3.94A39.4,39.4,0,0,1,6.25,11V9a39.4,39.4,0,0,0,11.66,1.51C26,10.53,32.52,8.79,33,6.61h0C32.8,3.2,23.52,2.28,18,2.28S3,3.21,3,6.71V29.29c0,3.49,9.43,4.43,15,4.43s15-.93,15-4.43V24.09C32.57,26.28,26,28,17.91,28A39.4,39.4,0,0,1,6.25,26.52v-2A39.4,39.4,0,0,0,17.91,26C26,26,32.57,24.28,33,22.09V16.34c-.43,2.2-7,3.94-15.09,3.94A39.4,39.4,0,0,1,6.25,18.77v-2A39.4,39.4,0,0,0,17.91,18.28Z"
                    ></path>
                </defs>

                <use href="#storage-path" className="dbOutline"></use>
                <use href="#storage-path" className="dbFill"></use>
                <use href="#storage-path" className="dbSheen"></use>
            </svg>
        </div>
    );
}
