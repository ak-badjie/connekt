'use client';

import { motion } from 'framer-motion';

interface ConnektMailLogoProps {
    size?: number;
    color?: string;
}

export default function ConnektMailLogo({ size = 80, color = '#f97316' }: ConnektMailLogoProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: 'visible' }}
        >
            {/* ENVELOPE STRUCTURE */}

            {/* Envelope Back Panel - slides in from left */}
            <motion.path
                d="M20 28 L60 28 L60 52 Q60 54 58 54 L22 54 Q20 54 20 52 Z"
                fill={color}
                fillOpacity="0.15"
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            />

            {/* Envelope Bottom Triangle Lines */}
            <motion.path
                d="M20 52 L40 38 L60 52"
                stroke={color}
                strokeWidth="2"
                fill="none"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            />

            {/* Envelope Top Flap - folds down */}
            <motion.path
                d="M20 28 L40 40 L60 28 Z"
                fill={color}
                fillOpacity="0.5"
                initial={{ scaleY: 0, y: -10, opacity: 0 }}
                animate={{ scaleY: 1, y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                style={{ transformOrigin: '40px 28px' }}
            />

            {/* LETTER SLIDING IN */}
            <motion.g
                initial={{ y: -25, opacity: 0 }}
                animate={{
                    y: [0, 0, 12],
                    opacity: [0, 1, 1]
                }}
                transition={{
                    duration: 1.4,
                    delay: 0.8,
                    times: [0, 0.4, 1],
                    ease: "easeInOut"
                }}
            >
                {/* Letter Paper */}
                <motion.rect
                    x="30"
                    y="22"
                    width="20"
                    height="26"
                    rx="1.5"
                    fill="white"
                    stroke={color}
                    strokeWidth="1.5"
                />

                {/* Letter Text Lines */}
                <motion.line
                    x1="33"
                    y1="28"
                    x2="47"
                    y2="28"
                    stroke={color}
                    strokeWidth="1.2"
                    strokeOpacity="0.6"
                />
                <motion.line
                    x1="33"
                    y1="32"
                    x2="47"
                    y2="32"
                    stroke={color}
                    strokeWidth="1.2"
                    strokeOpacity="0.6"
                />
                <motion.line
                    x1="33"
                    y1="36"
                    x2="45"
                    y2="36"
                    stroke={color}
                    strokeWidth="1.2"
                    strokeOpacity="0.6"
                />
                <motion.line
                    x1="33"
                    y1="40"
                    x2="47"
                    y2="40"
                    stroke={color}
                    strokeWidth="1.2"
                    strokeOpacity="0.6"
                />
            </motion.g>

            {/* CONNEKT 'C' SYMBOL - appears on envelope */}
            <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.3, ease: "backOut" }}
            >
                <motion.path
                    d="M 35 45 Q 32 45 32 42 Q 32 39 35 39 L 45 39 Q 48 39 48 42 Q 48 45 45 45 L 38 45"
                    stroke={color}
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                    animate={{
                        strokeOpacity: [0.8, 1, 0.8]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </motion.g>

            {/* SPARKLE EFFECTS */}
            {[
                { cx: 18, cy: 26, delay: 1.6 },
                { cx: 62, cy: 32, delay: 1.7 },
                { cx: 25, cy: 54, delay: 1.8 },
                { cx: 55, cy: 54, delay: 1.9 },
            ].map((sparkle, i) => (
                <motion.g
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                        scale: [0, 1.2, 0],
                        opacity: [0, 1, 0]
                    }}
                    transition={{
                        duration: 0.8,
                        delay: sparkle.delay,
                        ease: "easeInOut"
                    }}
                >
                    <path
                        d={`M ${sparkle.cx} ${sparkle.cy - 4} L ${sparkle.cx} ${sparkle.cy + 4} M ${sparkle.cx - 4} ${sparkle.cy} L ${sparkle.cx + 4} ${sparkle.cy}`}
                        stroke={color}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                </motion.g>
            ))}

            {/* MAIL INDICATOR DOT - bounces */}
            <motion.circle
                cx="52"
                cy="24"
                r="3"
                fill={color}
                initial={{ scale: 0 }}
                animate={{
                    scale: [0, 1, 1.2, 1],
                }}
                transition={{
                    duration: 0.6,
                    delay: 2.2,
                    ease: "easeOut"
                }}
            />
        </svg>
    );
}
