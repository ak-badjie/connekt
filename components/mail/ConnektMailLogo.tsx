'use client';

import { motion } from 'framer-motion';

interface ConnektMailLogoProps {
    size?: 'small' | 'medium' | 'large';
    color?: 'white' | 'teal';
}

export default function ConnektMailLogo({ size = 'medium', color = 'teal' }: ConnektMailLogoProps) {
    const isSmall = size === 'small';
    const isMedium = size === 'medium';
    const isLarge = size === 'large';

    // Dimensions
    const containerClass = isLarge ? 'w-32 h-32' : isMedium ? 'w-10 h-10' : 'w-10 h-10';
    const glassClass = isLarge ? 'w-28 h-28 rounded-3xl' : isMedium ? 'w-10 h-10 rounded-lg' : 'w-8 h-8 rounded-lg';

    // Colors
    const isTeal = color === 'teal';
    const strokeColor = isTeal ? '#008080' : '#ffffff';
    const glowColor = isTeal ? 'bg-[#008080]/20' : 'bg-[#008080]';

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
                    duration: 3, // Slightly slower for elegance
                    repeat: Infinity,
                    ease: 'linear',
                }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Inner Pulse */}
                <motion.div
                    className={`absolute inset-2 bg-gradient-to-br from-[#008080]/30 to-transparent ${isLarge ? 'rounded-2xl' : 'rounded-md'}`}
                    animate={{
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />

                {/* Custom Envelope SVG */}
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
                        {/* ENVELOPE RECTANGLE */}
                        <rect
                            x="10"
                            y="25"
                            width="60"
                            height="40"
                            rx="4"
                            stroke={strokeColor}
                            strokeWidth="6"
                            fill="none"
                        />

                        {/* ENVELOPE FLAP - Triangle pointing down */}
                        <path
                            d="M10 25 L40 50 L70 25"
                            stroke={strokeColor}
                            strokeWidth="6"
                            fill="none"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />

                        {/* STRIPES - From apex (40, 50) to bottom */}
                        {/* Left Stripe */}
                        <line
                            x1="40"
                            y1="50"
                            x2="20"
                            y2="65"
                            stroke={strokeColor}
                            strokeWidth="4"
                            strokeLinecap="round"
                        />
                        {/* Right Stripe */}
                        <line
                            x1="40"
                            y1="50"
                            x2="60"
                            y2="65"
                            stroke={strokeColor}
                            strokeWidth="4"
                            strokeLinecap="round"
                        />
                        {/* Center Stripe */}
                        <line
                            x1="40"
                            y1="50"
                            x2="40"
                            y2="65"
                            stroke={strokeColor}
                            strokeWidth="4"
                            strokeLinecap="round"
                        />
                    </svg>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}
