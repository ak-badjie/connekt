'use client';

import { motion } from 'framer-motion';

interface AnimatedConnektLogoProps {
    size?: number;
    color?: string;
}

export default function AnimatedConnektLogo({ size = 80, color = '#f97316' }: AnimatedConnektLogoProps) {
    const scale = size / 80;

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: 'visible' }}
        >
            {/* BRIEFCASE ASSEMBLY */}

            {/* Briefcase Bottom - slides up from below */}
            <motion.path
                d="M15 35 L15 55 Q15 58 18 58 L38 58 Q41 58 41 55 L41 35 Z"
                fill={color}
                fillOpacity="0.3"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0, ease: "easeOut" }}
            />

            {/* Briefcase Top - slides down from above */}
            <motion.path
                d="M15 35 L41 35 L41 30 Q41 27 38 27 L18 27 Q15 27 15 30 Z"
                fill={color}
                fillOpacity="0.5"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            />

            {/* Briefcase Handle - fades in */}
            <motion.path
                d="M22 27 L22 24 Q22 22 24 22 L32 22 Q34 22 34 24 L34 27"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
            />

            {/* Briefcase Lock */}
            <motion.circle
                cx="28"
                cy="45"
                r="2"
                fill={color}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.6, ease: "backOut" }}
            />

            {/* ENVELOPE ASSEMBLY */}

            {/* Envelope Back - slides in from left */}
            <motion.path
                d="M42 40 L68 40 L68 58 Q68 60 66 60 L44 60 Q42 60 42 58 Z"
                fill={color}
                fillOpacity="0.2"
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            />

            {/* Envelope Bottom Flap - slides up */}
            <motion.path
                d="M42 58 L55 48 L68 58"
                stroke={color}
                strokeWidth="1.5"
                fill="none"
                strokeLinejoin="round"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
            />

            {/* Envelope Front Triangle - folds down */}
            <motion.path
                d="M42 40 L55 48 L68 40 Z"
                fill={color}
                fillOpacity="0.6"
                initial={{ scaleY: 0, transformOrigin: 'center top' }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
                style={{ transformOrigin: '55px 40px' }}
            />

            {/* LETTER ANIMATION - slides into envelope */}
            <motion.g
                initial={{ y: -15, opacity: 0 }}
                animate={{
                    y: [0, 0, 8],
                    opacity: [0, 1, 1]
                }}
                transition={{
                    duration: 1.2,
                    delay: 1,
                    times: [0, 0.3, 1],
                    ease: "easeInOut"
                }}
            >
                {/* Letter Paper */}
                <motion.rect
                    x="48"
                    y="35"
                    width="14"
                    height="16"
                    rx="1"
                    fill="white"
                    stroke={color}
                    strokeWidth="1"
                />

                {/* Letter Lines */}
                <motion.line
                    x1="50"
                    y1="39"
                    x2="60"
                    y2="39"
                    stroke={color}
                    strokeWidth="0.8"
                    strokeOpacity="0.5"
                />
                <motion.line
                    x1="50"
                    y1="42"
                    x2="60"
                    y2="42"
                    stroke={color}
                    strokeWidth="0.8"
                    strokeOpacity="0.5"
                />
                <motion.line
                    x1="50"
                    y1="45"
                    x2="57"
                    y2="45"
                    stroke={color}
                    strokeWidth="0.8"
                    strokeOpacity="0.5"
                />
            </motion.g>

            {/* Connecting Arc - appears after assembly */}
            <motion.path
                d="M 35 45 Q 40 42 45 45"
                stroke={color}
                strokeWidth="1.5"
                strokeDasharray="3 2"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 0.8, delay: 1.2, ease: "easeInOut" }}
            />

            {/* Sparkle Effects */}
            {[
                { cx: 20, cy: 30, delay: 1.5 },
                { cx: 38, cy: 50, delay: 1.6 },
                { cx: 52, cy: 38, delay: 1.7 },
                { cx: 65, cy: 55, delay: 1.8 },
            ].map((sparkle, i) => (
                <motion.g
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0]
                    }}
                    transition={{
                        duration: 0.6,
                        delay: sparkle.delay,
                        ease: "easeInOut"
                    }}
                >
                    <path
                        d={`M ${sparkle.cx} ${sparkle.cy - 3} L ${sparkle.cx} ${sparkle.cy + 3} M ${sparkle.cx - 3} ${sparkle.cy} L ${sparkle.cx + 3} ${sparkle.cy}`}
                        stroke={color}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                </motion.g>
            ))}
        </svg>
    );
}
