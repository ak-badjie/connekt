'use client';

import React from 'react';
import styles from './ConnektStorageLogo.module.css';

export default function ConnektStorageLogo() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white">
      <div className={styles.mainContainer}>
        <svg className={styles.storageSvg} viewBox="0 0 36 36" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <path id="storage-path" d="M17.91,18.28c8.08,0,14.66-1.74,15.09-3.94V8.59c-.43,2.2-7,3.94-15.09,3.94A39.4,39.4,0,0,1,6.25,11V9a39.4,39.4,0,0,0,11.66,1.51C26,10.53,32.52,8.79,33,6.61h0C32.8,3.2,23.52,2.28,18,2.28S3,3.21,3,6.71V29.29c0,3.49,9.43,4.43,15,4.43s15-.93,15-4.43V24.09C32.57,26.28,26,28,17.91,28A39.4,39.4,0,0,1,6.25,26.52v-2A39.4,39.4,0,0,0,17.91,26C26,26,32.57,24.28,33,22.09V16.34c-.43,2.2-7,3.94-15.09,3.94A39.4,39.4,0,0,1,6.25,18.77v-2A39.4,39.4,0,0,0,17.91,18.28Z"></path>
          </defs>

          <use href="#storage-path" className={styles.dbOutline}></use>
          <use href="#storage-path" className={styles.dbFill}></use>
          <use href="#storage-path" className={styles.dbSheen}></use>
        </svg>

        <div className={styles.textArea}>
          <h1 className={styles.title}>ConnektStorage</h1>
          <span className={styles.slogan}>Scale Beyond Your Self</span>
        </div>

        <div className={styles.loaderContainer}>
          <div className={styles.loaderBar}></div>
        </div>
      </div>
    </div>
  );
}