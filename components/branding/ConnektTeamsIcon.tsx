'use client';

import React from 'react';

interface ConnektTeamsIconProps {
    className?: string;
}

export default function ConnektTeamsIcon({ className = 'w-6 h-6' }: ConnektTeamsIconProps) {
    return (
        <div className={`${className} flex items-center justify-center`}>
            <style jsx>{`
                .team-icon {
                    width: 100%;
                    height: 100%;
                    overflow: visible;
                }

                .svgPart {
                    fill: transparent;
                    stroke: #0d9488;
                    stroke-width: 8px;
                    stroke-miterlimit: 10;
                    stroke-dasharray: 1500;
                    stroke-dashoffset: 1500;
                    opacity: 1;
                    transform-origin: center center;
                }

                .partHub {
                    transform-box: fill-box;
                    transform-origin: center;
                    animation:
                        hubEnter 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                        fillSolid 0.5s ease-out 1.8s forwards;
                    stroke-dasharray: 0;
                    stroke-dashoffset: 0;
                    stroke-width: 0;
                    fill: #0d9488;
                }

                .structureLeft,
                .structureRight {
                    animation:
                        lineDraw 1.5s ease-in-out 0.5s forwards,
                        fillSolid 0.6s ease-out 1.8s forwards;
                }

                .connectors {
                    opacity: 0;
                    fill: #115e59;
                    stroke: none;
                    transform-origin: center;
                    animation: snapIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 2s forwards;
                }

                @keyframes hubEnter {
                    0% {
                        transform: scale(0);
                        opacity: 0;
                    }

                    50% {
                        opacity: 1;
                    }

                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                @keyframes lineDraw {
                    to {
                        stroke-dashoffset: 0;
                    }
                }

                @keyframes fillSolid {
                    from {
                        fill: transparent;
                        stroke-width: 8px;
                    }

                    to {
                        fill: #0d9488;
                        stroke-width: 0;
                    }
                }

                @keyframes snapIn {
                    0% {
                        opacity: 0;
                        transform: scale(0);
                    }

                    60% {
                        transform: scale(1.15);
                    }

                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `}</style>

            <svg
                className="team-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                xmlSpace="preserve"
            >
                <g>
                    <path
                        className="partHub"
                        d="M256.494,96.433c26.632,0,48.209-21.592,48.209-48.201C304.703,21.584,283.126,0,256.494,0 c-26.647,0-48.216,21.584-48.216,48.232C208.278,74.84,229.847,96.433,256.494,96.433z"
                    />

                    <path
                        className="svgPart structureRight"
                        d="M321.225,126.746l-64.731,64.731l-65.139-65.131c-14.756,9.176-26.412,25.91-26.412,41.718v162.059 c0,11.687,9.466,21.153,21.153,21.153c5.738,0,0,0,14.757,0l8.045,138.214c0,12.433,10.078,22.511,22.519,22.511 c5.236,0,14.92,0,24.583,0c9.67,0,19.34,0,24.591,0c12.432,0,22.503-10.078,22.503-22.511l8.052-138.214c14.757,0,9.003,0,14.757,0 c11.679,0,21.145-9.466,21.145-21.153V168.063C347.049,152.475,335.715,136,321.225,126.746z"
                    />

                    <polygon className="connectors" points="242.076,165.732 256.463,180.119 269.807,166.784 269.807,140.82 242.076,140.82" />
                    <rect x="242.091" y="113.787" className="connectors" width="27.691" height="17.747" />

                    <path
                        className="svgPart structureRight"
                        d="M408.711,149.084c23.28,0,42.102-18.854,42.102-42.11c0-23.256-18.822-42.11-42.102-42.11 c-23.249,0-42.094,18.853-42.094,42.11C366.617,130.231,385.462,149.084,408.711,149.084z"
                    />
                    <path
                        className="svgPart structureRight"
                        d="M458.065,171.784l-50.202,50.194l-33.123-33.123v141.267c0,13.586-5.62,25.815-14.614,34.669v6.852 l7.025,120.694c0,10.856,8.815,19.662,19.662,19.662c4.592,0,13.029,0,21.475,0c8.453,0,16.899,0,21.474,0 c10.863,0,19.662-8.806,19.662-19.662l7.025-120.694c12.889,0,7.873,0,12.889,0c10.204,0,18.468-8.265,18.468-18.484V211.641 C487.805,195.511,473.936,178.314,458.065,171.784z"
                    />

                    <polygon className="connectors" points="407.886,210.581 421.073,197.403 421.073,180.323 395.752,180.323 395.752,198.447" />
                    <rect x="395.744" y="160.23" className="connectors" width="25.344" height="11.648" />

                    <path
                        className="svgPart structureLeft"
                        d="M103.289,149.084c23.249,0,42.094-18.854,42.094-42.11c0-23.256-18.845-42.11-42.094-42.11 c-23.28,0-42.102,18.853-42.102,42.11C61.187,130.231,80.009,149.084,103.289,149.084z"
                    />
                    <path
                        className="svgPart structureLeft"
                        d="M137.26,188.855l-33.123,33.123l-50.202-50.194c-15.87,6.53-29.74,23.727-29.74,39.858v141.518 c0,10.22,8.265,18.484,18.468,18.484c5.015,0,0,0,12.888,0l7.026,120.694c0,10.856,8.798,19.662,19.661,19.662 c4.576,0,13.022,0,21.475,0c8.446,0,16.883,0,21.475,0c10.848,0,19.662-8.806,19.662-19.662l7.025-120.694v-6.852 c-8.994-8.854-14.614-21.083-14.614-34.669V188.855z"
                    />

                    <polygon className="connectors" points="104.113,210.581 116.248,198.447 116.248,180.323 90.927,180.323 90.927,197.403" />
                    <rect x="90.911" y="160.23" className="connectors" width="25.345" height="11.648" />
                </g>
            </svg>
        </div>
    );
}
