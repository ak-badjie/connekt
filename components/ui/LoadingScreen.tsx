'use client';

import { motion } from 'framer-motion';
import { Mail } from 'lucide-react'; // Keeping for fallback if needed
import AnimatedConnektLogo from './AnimatedConnektLogo'; // Import animated logo

interface LoadingScreenProps {
    variant?: 'default' | 'mail';
}

export default function LoadingScreen({ variant = 'default' }: LoadingScreenProps) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-zinc-900 overflow-hidden">
            <div className="relative flex flex-col items-center">

                {/* Background Ambient Glow - Enhanced to Orange */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className={`absolute -z-10 h-64 w-64 rounded-full blur-3xl ${variant === 'mail' ? 'bg-orange-500/20' : 'bg-[#008080]/20'
                        }`}
                />

                {/* 3D Logo Container */}
                <motion.div
                    style={{ perspective: 1000 }}
                    className="relative mb-8"
                >
                    <motion.div
                        animate={{
                            rotateY: [0, 360],
                            rotateX: [0, 10, 0, -10, 0],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="relative z-10"
                    >
                        {variant === 'mail' ? (
                            <div className="relative">
                                {/* NEW ANIMATED LOGO HERE */}
                                <AnimatedConnektLogo size={80} color="#f97316" />
                            </div>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="100"
                                height="100"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-[#008080] drop-shadow-2xl"
                            >
                                <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                <rect width="20" height="14" x="2" y="6" rx="2"></rect>
                                <path d="M12 12h.01"></path>
                            </svg>
                        )}
                    </motion.div>

                    {/* Shadow */}
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.2, 0.5, 0.2]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 h-4 w-20 rounded-[100%] bg-orange-900/20 blur-md dark:bg-white/20"
                    />
                </motion.div>

                {/* Text Animation */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center gap-2"
                >
                    <h1 className={`text-3xl font-bold tracking-[0.3em] font-headline ${variant === 'mail' ? 'text-orange-500' : 'text-[#008080]'
                        }`}>
                        {variant === 'mail' ? 'MAILING' : 'CONNEKT'}
                    </h1>

                    <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                    ease: "easeInOut"
                                }}
                                className={`h-2 w-2 rounded-full ${variant === 'mail' ? 'bg-orange-400' : 'bg-teal-400'
                                    }`}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
