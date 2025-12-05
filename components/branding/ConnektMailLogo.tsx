'use client';

import React from 'react';
import styles from './ConnektMailLogo.module.css';

interface ConnektMailLogoProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export default function ConnektMailLogo({ size = 'medium', color }: ConnektMailLogoProps) {
  const sizeClass = size === 'large' ? 'scale-125' : size === 'small' ? 'scale-90' : '';

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white">
      <div className={`${styles.container} ${sizeClass}`}>
        <svg
          className={styles.logoSvg}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          style={color ? { color } : undefined}
        >
          <path className={styles.mailPath} d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
        </svg>

        <div className={styles.textWrapper}>
          <h1 className={styles.brandName}>ConnektMail</h1>
          <div className={styles.brandSlogan}>Scale Your Outreach</div>
        </div>

        <div className={styles.loaderTrack}>
          <div className={styles.loaderFill}></div>
        </div>
      </div>
    </div>
  );
}