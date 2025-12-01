import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { WalletService } from './wallet-service';

const MODEM_PAY_PUBLIC_KEY = process.env.MODEM_PAY_PUBLIC_KEY;
const MODEM_PAY_SECRET_KEY = process.env.MODEM_PAY_SECRET_KEY;
const MODEM_PAY_MERCHANT_ID = process.env.MODEM_PAY_MERCHANT_ID;
const MODEM_PAY_BASE_URL = 'https://api.modempay.com/v1'; // Verify this URL

export const ModemPayService = {
    /**
     * Initiate a payment request to Modem Pay
     */
    async initiatePayment(amount: number, currency: string = 'GMD', walletId: string, returnUrl: string) {
        if (!MODEM_PAY_PUBLIC_KEY || !MODEM_PAY_MERCHANT_ID) {
            throw new Error('Modem Pay credentials not configured');
        }

        const reference = `topup_${walletId}_${Date.now()}`;

        try {
            const response = await fetch(`${MODEM_PAY_BASE_URL}/payment/initiate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${MODEM_PAY_SECRET_KEY}`
                },
                body: JSON.stringify({
                    merchant_id: MODEM_PAY_MERCHANT_ID,
                    amount,
                    currency,
                    reference,
                    description: 'Wallet Top-up',
                    return_url: returnUrl,
                    // specific fields for Wave might be needed here
                    payment_method: 'wave'
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to initiate payment');
            }

            const data = await response.json();
            return {
                paymentUrl: data.payment_url, // URL to redirect user to
                transactionId: data.transaction_id,
                reference
            };
        } catch (error) {
            console.error('Modem Pay Initiation Error:', error);
            throw error;
        }
    },

    /**
     * Verify a payment (can be called from webhook or client return)
     */
    async verifyPayment(transactionId: string) {
        if (!MODEM_PAY_SECRET_KEY) {
            throw new Error('Modem Pay credentials not configured');
        }

        try {
            const response = await fetch(`${MODEM_PAY_BASE_URL}/payment/verify/${transactionId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${MODEM_PAY_SECRET_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to verify payment');
            }

            return await response.json();
        } catch (error) {
            console.error('Modem Pay Verification Error:', error);
            throw error;
        }
    }
};
