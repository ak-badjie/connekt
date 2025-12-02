'use client';

import React from 'react';
import styles from './ConnektWalletLogo.module.css';

export default function ConnektWalletLogo() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white">
      <div className={styles.container}>
        <svg className={styles.walletIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path className={styles.walletPath} d="M19,7H18V6a3,3,0,0,0-3-3H5A3,3,0,0,0,2,6H2V18a3,3,0,0,0,3,3H19a3,3,0,0,0,3-3V10A3,3,0,0,0,19,7ZM5,5H15a1,1,0,0,1,1,1V7H5A1,1,0,0,1,5,5ZM20,15H19a1,1,0,0,1,0-2h1Zm0-4H19a3,3,0,0,0,0,6h1v1a1,1,0,0,1-1,1H5a1,1,0,0,1-1-1V8.83A3,3,0,0,0,5,9H19a1,1,0,0,1,1,1Z" />
        </svg>

        <div className={styles.brandWrapper}>
          <h1 className={styles.titleText}>ConnektWallet</h1>
          <span className={styles.subtitle}>Secure & Trusted</span>
        </div>

        <div className={styles.loaderBox}>
          <div className={styles.loaderInner}></div>
        </div>
      </div>
    </div>
  );
}