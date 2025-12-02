'use client';

import React from 'react';
import styles from './ConnektLogo.module.css';

export default function ConnektLogo() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white">
      <div className={styles.container}>
        <svg className={styles.logoSvg} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path className={styles.partHandle} d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          <rect className={styles.partBody} width="20" height="14" x="2" y="7" rx="2" ry="2" />
        </svg>

        <div className={styles.textWrapper}>
          <h1 className={styles.brandName}>CONNEKT</h1>
          <div className={styles.brandSlogan}>Scale Beyond Yourself</div>
        </div>

        <div className={styles.loaderTrack}>
          <div className={styles.loaderFill}></div>
        </div>
      </div>
    </div>
  );
}