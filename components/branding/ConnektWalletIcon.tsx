'use client';

import React from 'react';

interface ConnektWalletIconProps {
    className?: string;
}

export default function ConnektWalletIcon({ className = 'w-6 h-6' }: ConnektWalletIconProps) {
    return (
        <div className={`${className} flex items-center justify-center`}>
            <style jsx>{`
                .wallet-icon {
                    width: 100%;
                    height: 100%;
                    overflow: visible;
                    display: block;
                }

                .wallet-path {
                    fill: transparent;
                    stroke: #009688;
                    stroke-width: 0.5;
                    stroke-dasharray: 150;
                    stroke-dashoffset: 150;
                    animation:
                        draw 2s ease-in-out forwards,
                        fillIn 0.5s 1.8s ease-in-out forwards;
                }

                @keyframes draw {
                    to {
                        stroke-dashoffset: 0;
                    }
                }

                @keyframes fillIn {
                    from {
                        fill: transparent;
                        stroke-width: 0.5;
                    }

                    to {
                        fill: #009688;
                        stroke-width: 0;
                    }
                }
            `}</style>

            <svg className="wallet-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                    className="wallet-path"
                    d="M19,7H18V6a3,3,0,0,0-3-3H5A3,3,0,0,0,2,6H2V18a3,3,0,0,0,3,3H19a3,3,0,0,0,3-3V10A3,3,0,0,0,19,7ZM5,5H15a1,1,0,0,1,1,1V7H5A1,1,0,0,1,5,5ZM20,15H19a1,1,0,0,1,0-2h1Zm0-4H19a3,3,0,0,0,0,6h1v1a1,1,0,0,1-1,1H5a1,1,0,0,1-1-1V8.83A3,3,0,0,0,5,9H19a1,1,0,0,1,1,1Z"
                />
            </svg>
        </div>
    );
}
