'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Video,
  ShieldCheck,
  Sparkles,
  Target,
  ArrowRight,
  Play,
} from 'lucide-react';

// Feature items for the left side
const FEATURES = [
  {
    icon: Video,
    label: 'Trailer Videos',
    description: 'Showcase your personality'
  },
  {
    icon: Sparkles,
    label: 'AI Bio Enhancer',
    description: 'Streamline your story'
  },
  {
    icon: ShieldCheck,
    label: 'Trust Score',
    description: 'Build credibility'
  },
  {
    icon: Target,
    label: 'Auto Match',
    description: 'Find perfect opportunities'
  }
];

export default function ProfileSection() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  return (
    <section className="w-full py-16 md:py-24 px-6 md:px-12 lg:px-20 bg-white">
      <div className="max-w-7xl mx-auto">

        {/* Main Card Container with Ankara Background */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="relative rounded-[2rem] md:rounded-[3rem] overflow-hidden"
          style={{
            backgroundImage: `url('/ankara.jpeg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* No overlay - ankara pattern visible */}

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0">

            {/* LEFT SIDE: Text Content */}
            <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16">

              {/* Main Heading */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-4"
              >
                Your Digital
                <br />
                <span className="text-[#008080]">Essence</span>
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-white text-base md:text-lg mb-8 max-w-md"
              >
                Static resumes are history. Showcase your personality with AI-powered tools that streamline your story.
              </motion.p>

              {/* Feature Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 gap-4 mb-8"
              >
                {FEATURES.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={feature.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:border-[#008080]/50 transition-colors cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#008080]/20 flex items-center justify-center group-hover:bg-[#008080] transition-colors">
                        <Icon className="w-5 h-5 text-[#008080] group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-bold">{feature.label}</p>
                        <p className="text-white/80 text-xs">{feature.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* CTA Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#008080] text-white font-bold rounded-full w-fit hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20"
              >
                Create Your Profile
                <ArrowRight size={18} />
              </motion.button>
            </div>

            {/* RIGHT SIDE: Video Section */}
            <div className="relative flex items-center justify-center p-8 md:p-12 lg:p-16 lg:pl-0">

              {/* Video Container */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="relative w-full max-w-xl"
              >
                {/* Video with curved borders */}
                <video
                  src="/video.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto object-cover rounded-2xl shadow-2xl"
                />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}