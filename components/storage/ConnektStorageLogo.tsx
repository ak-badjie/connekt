'use client';

import { motion } from 'framer-motion';

interface ConnektStorageLogoProps {
    size?: 'small' | 'medium' | 'large';
    color?: 'white' | 'teal' | 'purple';
}

export default function ConnektStorageLogo({ size = 'medium', color = 'teal' }: ConnektStorageLogoProps) {
    const isSmall = size === 'small';
    const isMedium = size === 'medium';
    const isLarge = size === 'large';

    // Dimensions
    const containerClass = isLarge ? 'w-32 h-32' : isMedium ? 'w-10 h-10' : 'w-10 h-10';
    const glassClass = isLarge ? 'w-28 h-28 rounded-3xl' : isMedium ? 'w-10 h-10 rounded-lg' : 'w-8 h-8 rounded-lg';

    // Colors
    const isTeal = color === 'teal';
    const isPurple = color === 'purple';
    const strokeColor = isTeal ? '#008080' : isPurple ? '#9333EA' : '#ffffff';
    const glowColor = isTeal ? 'bg-[#008080]/20' : isPurple ? 'bg-purple-600/20' : 'bg-[#008080]';

    // SVG Size inside the container
    const svgSize = isLarge ? 60 : isMedium ? 24 : 18;

    return (
        <motion.div
            className={`relative ${containerClass} flex items-center justify-center`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
        >
            {/* Glow Effect */}
            <motion.div
                className={`absolute inset-0 ${glowColor} ${isLarge ? 'rounded-3xl blur-3xl' : 'rounded-xl blur-md'}`}
                animate={{
                    opacity: [0.2, 0.5, 0.2],
                    scale: [0.8, 1.1, 0.8],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            {/* Glass Container */}
            <motion.div
                className={`relative ${glassClass} bg-white/10 backdrop-blur-xl border border-white/40 flex items-center justify-center shadow-2xl`}
                animate={{
                    rotateY: [0, 360],
                    rotateX: [0, 15, 0],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Inner Pulse */}
                <motion.div
                    className={`absolute inset-2 bg-gradient-to-br from-purple-500/30 to-transparent ${isLarge ? 'rounded-2xl' : 'rounded-md'}`}
                    animate={{
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />

                {/* Custom Database/Storage SVG */}
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    className="relative z-10 flex items-center justify-center"
                >
                    <svg
                        width={svgSize}
                        height={svgSize}
                        viewBox="0 0 80 80"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ overflow: 'visible' }}
                    >
                        {/* DATABASE CYLINDER - Top ellipse */}
                        <ellipse
                            cx="40"
                            cy="25"
                            rx="20"
                            ry="8"
                            stroke={strokeColor}
                            strokeWidth="5"
                            fill="none"
                        />

                        {/* LEFT VERTICAL LINE */}
                        <line
                            x1="20"
                            y1="25"
                            x2="20"
                            y2="55"
                            stroke={strokeColor}
                            strokeWidth="5"
                            strokeLinecap="round"
                        />

                        {/* RIGHT VERTICAL LINE */}
                        <line
                            x1="60"
                            y1="25"
                            x2="60"
                            y2="55"
                            stroke={strokeColor}
                            strokeWidth="5"
                            strokeLinecap="round"
                        />

                        {/* BOTTOM ELLIPSE */}
                        <ellipse
                            cx="40"
                            cy="55"
                            rx="20"
                            ry="8"
                            stroke={strokeColor}
                            strokeWidth="5"
                            fill="none"
                        />

                        {/* MIDDLE DISK SEPARATOR 1 */}
                        <ellipse
                            cx="40"
                            cy="35"
                            rx="20"
                            ry="8"
                            stroke={strokeColor}
                            strokeWidth="3"
                            fill="none"
                            opacity="0.6"
                        />

                        {/* MIDDLE DISK SEPARATOR 2 */}
                        <ellipse
                            cx="40"
                            cy="45"
                            rx="20"
                            ry="8"
                            stroke={strokeColor}
                            strokeWidth="3"
                            fill="none"
                            opacity="0.6"
                        />

                        {/* DATA DOTS - Simulating stored data */}
                        <circle cx="35" cy="35" r="2" fill={strokeColor} opacity="0.7" />
                        <circle cx="45" cy="35" r="2" fill={strokeColor} opacity="0.7" />
                        <circle cx="35" cy="45" r="2" fill={strokeColor} opacity="0.7" />
                        <circle cx="45" cy="45" r="2" fill={strokeColor} opacity="0.7" />
                    </svg>
                </motion.div>
            </motion.div>

            {/* Accent Particles */}
            {isLarge && [...Array(3)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-purple-500 rounded-full"
                    style={{
                        left: `${30 + i * 20}%`,
                        top: `${20 + i * 15}%`,
                    }}
                    animate={{
                        y: [0, -15, 0],
                        opacity: [0.4, 1, 0.4],
                    }}
                    transition={{
                        duration: 2,
                        delay: i * 0.3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </motion.div>
    );
}
