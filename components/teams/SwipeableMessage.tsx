'use client';

import React, { useRef, useState } from 'react';
import { motion, useAnimation, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Reply } from 'lucide-react';

interface SwipeableMessageProps {
  children: React.ReactNode;
  onReply: () => void;
  disabled?: boolean;
}

export default function SwipeableMessage({ children, onReply, disabled = false }: SwipeableMessageProps) {
  const controls = useAnimation();
  const x = useMotionValue(0);
  const [isTriggered, setIsTriggered] = useState(false);
  
  // Transform x value to opacity/scale for the icon
  // Icon appears as we drag from 0px to 60px
  const iconOpacity = useTransform(x, [0, 30, 60], [0, 0.5, 1]);
  const iconScale = useTransform(x, [0, 60], [0.5, 1.2]);
  const iconRotate = useTransform(x, [0, 60], [0, -10]);

  const handleDragEnd = async (_: any, info: PanInfo) => {
    // Threshold to trigger reply (dragged more than 60px)
    if (info.offset.x > 60) {
      // Trigger haptic feedback if available
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
      onReply();
    }
    
    // Reset animation
    setIsTriggered(false);
    await controls.start({ x: 0 });
  };

  const handleDrag = (_: any, info: PanInfo) => {
    if (info.offset.x > 60 && !isTriggered) {
      setIsTriggered(true);
    } else if (info.offset.x < 60 && isTriggered) {
      setIsTriggered(false);
    }
  };

  if (disabled) return <>{children}</>;

  return (
    <div className="relative w-full flex items-center">
      {/* Background Reply Icon (Sticky on the left) */}
      <div className="absolute left-4 z-0 flex items-center justify-center h-full">
        <motion.div
          style={{ 
            opacity: iconOpacity, 
            scale: iconScale,
            rotate: iconRotate 
          }}
          className={`
            w-8 h-8 rounded-full bg-white shadow-sm border border-emerald-100 
            flex items-center justify-center text-emerald-600
            ${isTriggered ? 'bg-emerald-50 text-emerald-700 shadow-md' : ''}
          `}
        >
          <Reply size={18} strokeWidth={2.5} />
        </motion.div>
      </div>

      {/* Swipeable Foreground */}
      <motion.div
        className="w-full z-10 relative"
        drag="x"
        dragConstraints={{ left: 0, right: 100 }} // Limit drag distance
        dragElastic={0.1} // Strong resistance
        dragDirectionLock
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
        // Only allow dragging to the right (reply)
        dragMomentum={false} 
      >
        {children}
      </motion.div>
    </div>
  );
}