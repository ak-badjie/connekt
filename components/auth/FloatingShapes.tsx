'use client';

import { motion } from 'framer-motion';

interface FloatingShapesProps {
    variant?: 'light' | 'dark';
}

export function FloatingShapes({ variant = 'dark' }: FloatingShapesProps) {
    const shapes = [
        { type: 'circle', size: 120, x: '10%', y: '20%', delay: 0, color: 'teal' },
        { type: 'triangle', size: 80, x: '80%', y: '15%', delay: 0.5, color: 'gray' },
        { type: 'circle', size: 60, x: '25%', y: '70%', delay: 1, color: 'gray' },
        { type: 'triangle', size: 100, x: '70%', y: '60%', delay: 1.5, color: 'teal' },
        { type: 'circle', size: 90, x: '50%', y: '40%', delay: 2, color: 'teal' },
        { type: 'triangle', size: 70, x: '15%', y: '50%', delay: 2.5, color: 'gray' },
    ];

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {shapes.map((shape, i) => (
                <motion.div
                    key={i}
                    className="absolute"
                    style={{
                        left: shape.x,
                        top: shape.y,
                        width: shape.size,
                        height: shape.size,
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                        opacity: [0.1, 0.3, 0.1],
                        scale: [1, 1.2, 1],
                        rotate: shape.type === 'triangle' ? [0, 120, 240, 360] : 0,
                        y: [0, -30, 0],
                    }}
                    transition={{
                        duration: 8,
                        delay: shape.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                >
                    {shape.type === 'circle' ? (
                        <div
                            className={`w-full h-full rounded-full ${shape.color === 'teal'
                                    ? 'bg-[#008080]'
                                    : 'bg-gray-500'
                                } blur-2xl`}
                        />
                    ) : (
                        <div
                            className={`w-0 h-0 border-l-[${shape.size / 2}px] border-r-[${shape.size / 2
                                }px] border-b-[${shape.size}px] border-l-transparent border-r-transparent ${shape.color === 'teal'
                                    ? 'border-b-[#008080]'
                                    : 'border-b-gray-500'
                                } blur-xl`}
                            style={{
                                borderLeftWidth: `${shape.size / 2}px`,
                                borderRightWidth: `${shape.size / 2}px`,
                                borderBottomWidth: `${shape.size}px`,
                            }}
                        />
                    )}
                </motion.div>
            ))}
        </div>
    );
}
