'use client';

import { motion, AnimatePresence } from 'framer-motion';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';

interface AIGenerationOverlayProps {
    isVisible: boolean;
    message?: string;
}

export function AIGenerationOverlay({ isVisible, message = 'AI is generating...' }: AIGenerationOverlayProps) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    style={{ margin: 0 }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative flex flex-col items-center gap-6 p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-teal-200 dark:border-teal-800"
                    >
                        {/* Animated AI Icon */}
                        <div className="relative">
                            {/* Pulsing background */}
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.3, 0.6, 0.3],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                                className="absolute inset-0 bg-teal-500 rounded-full blur-3xl"
                            />

                            {/* AI Icon - Uses its own internal animation */}
                            <div className="relative">
                                <ConnektAIIcon className="w-24 h-24" />
                            </div>
                        </div>

                        {/* Message */}
                        <div className="text-center">
                            <motion.h3
                                animate={{
                                    opacity: [0.7, 1, 0.7],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                                className="text-xl font-bold text-gray-900 dark:text-white mb-2"
                            >
                                {message}
                            </motion.h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                This may take a few moments
                            </p>
                        </div>

                        {/* Loading dots */}
                        <div className="flex gap-2">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        y: [0, -10, 0],
                                    }}
                                    transition={{
                                        duration: 0.6,
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                    }}
                                    className="w-3 h-3 bg-teal-600 rounded-full"
                                />
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
