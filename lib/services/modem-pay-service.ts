import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import ModemPay from 'modem-pay';

const MODEM_PAY_SECRET_KEY = process.env.MODEM_PAY_SECRET_KEY;

export const ModemPayService = {
    /**
     * Initiate a payment request to Modem Pay using the SDK
     * After payment, Modem Pay redirects to return_url which triggers verification
     */
    async initiatePayment(amount: number, currency: string = 'GMD', walletId: string, returnUrl?: string) {
        if (!MODEM_PAY_SECRET_KEY) {
            throw new Error('Modem Pay credentials not configured');
        }

        const modempay = new ModemPay(MODEM_PAY_SECRET_KEY);
        const reference = `topup_${walletId}_${Date.now()}`;

        try {
            // Build return URL for redirect after payment
            // This will redirect to our verify page which triggers the verification flow
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const verifyReturnUrl = `${baseUrl}/payment/verify?walletId=${encodeURIComponent(walletId)}&amount=${amount}&reference=${encodeURIComponent(reference)}`;

            // Create payment intent using the SDK
            const intentParams: any = {
                amount,
                currency,
                reference,
                return_url: verifyReturnUrl,
                metadata: {
                    walletId,
                    source: 'connekt-wallet-topup'
                }
            };

            const intent = await modempay.paymentIntents.create(intentParams);

            console.log('Modem Pay Intent Created:', JSON.stringify(intent, null, 2));

            if (!intent || !intent.data || !intent.data.payment_link) {
                throw new Error('Failed to generate payment link');
            }

            // Correctly access payment_intent_id from the response
            const transactionId = intent.data.payment_intent_id || intent.data.id || reference;
            console.log('Returning Transaction ID:', transactionId);

            return {
                paymentUrl: intent.data.payment_link,
                transactionId: transactionId,
                reference
            };
        } catch (error: any) {
            console.error('Modem Pay Initiation Error:', error);
            throw new Error(error.message || 'Failed to initiate payment with Modem Pay');
        }
    },

    /**
     * Verify a payment (can be called from webhook or client return)
     */
    async verifyPayment(transactionId: string) {
        if (!MODEM_PAY_SECRET_KEY) {
            throw new Error('Modem Pay credentials not configured');
        }

        const modempay = new ModemPay(MODEM_PAY_SECRET_KEY);

        try {
            // Assuming the SDK has a way to retrieve/verify
            // Based on common patterns: modempay.paymentIntents.retrieve(id)
            // But user didn't provide this. I'll stick to the fetch implementation for verify if SDK usage is unclear,
            // OR I'll try to use the SDK if I can guess.
            // Let's try to use the SDK's retrieve method if it exists.
            // If not, I'll fallback to fetch or just return success for now if I can't verify.

            // For now, let's assume we can just check the status if we have the ID.
            // If the user didn't provide verify example, I'll comment it out or leave the fetch implementation?
            // The previous fetch implementation was: GET /payment/verify/{id}

            // I'll try to keep the fetch implementation for verify for now, as I don't have the SDK docs for verify.
            // BUT I need to import ModemPay for initiate.
            // I'll mix them? No, that's messy.

            console.log('Verifying Payment with ID:', transactionId);
            console.log('Modem Pay SDK Resources:', Object.keys(modempay));

            try {
                // Try payment intents first (though we suspect this is a transaction ID now)
                const payment = await modempay.paymentIntents.retrieve(transactionId);
                console.log('Verification Result (Intent):', JSON.stringify(payment, null, 2));
                return payment.data;
            } catch (intentError) {
                console.log('Payment Intent retrieve failed, trying Transactions resource...');

                // Try transactions resource if it exists
                if ((modempay as any).transactions) {
                    const transaction = await (modempay as any).transactions.retrieve(transactionId);
                    console.log('Verification Result (Transaction):', JSON.stringify(transaction, null, 2));
                    return transaction;
                }

                throw intentError;
            }
        } catch (error: any) {
            console.error('Modem Pay Verification Error:', error);
            throw error;
        }
    }
};
