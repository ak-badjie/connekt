'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

function VerifyContent() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying payment...');

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                const transactionId = searchParams.get('transaction_id') || searchParams.get('reference');
                const walletIdParam = searchParams.get('walletId');
                const amount = searchParams.get('amount');
                const reference = searchParams.get('reference');
                // Modem Pay sends status in the return URL!
                const paymentStatus = searchParams.get('status')?.toLowerCase();

                if (!walletIdParam) {
                    throw new Error('Missing wallet information');
                }

                // Extract raw userId from walletId (e.g., "user_abc123" -> "abc123")
                const userId = walletIdParam.startsWith('user_')
                    ? walletIdParam.substring(5)
                    : walletIdParam;

                console.log('[VerifyPage] Payment return data:', { transactionId, userId, amount, paymentStatus, reference });

                // Dynamic imports to avoid SSR issues
                const { realtimeDb } = await import('@/lib/firebase');
                const { ref, set } = await import('firebase/database');
                const paymentStatusRef = ref(realtimeDb, `payment_status/${userId}`);

                // Step 1: Write "verifying" status to RTDB to trigger Dynamic Island
                await set(paymentStatusRef, {
                    status: 'verifying',
                    amount: Number(amount) || 0,
                    transactionId: transactionId || 'unknown',
                    timestamp: Date.now()
                });

                console.log('[VerifyPage] RTDB verifying status set');

                // Step 2: Check if Modem Pay sent a completed status
                if (paymentStatus === 'completed' || paymentStatus === 'success' || paymentStatus === 'successful' || paymentStatus === 'paid') {
                    console.log('[VerifyPage] Payment completed! Processing wallet update...');

                    // Call our API to process the payment (update wallet balance)
                    const response = await fetch('/api/wallet/process-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            walletId: walletIdParam,
                            amount: Number(amount),
                            transactionId: transactionId,
                            reference: reference
                        })
                    });

                    const result = await response.json();

                    if (result.success) {
                        // Write success to RTDB
                        await set(paymentStatusRef, {
                            status: 'success',
                            amount: Number(amount) || 0,
                            transactionId: transactionId || 'unknown',
                            message: `Wallet credited with GMD ${Number(amount).toFixed(2)}`,
                            timestamp: Date.now()
                        });

                        console.log('[VerifyPage] Payment processed successfully!');
                        setStatus('success');
                        setMessage(`Your wallet has been credited with GMD ${Number(amount).toFixed(2)}`);
                    } else {
                        throw new Error(result.error || 'Failed to process payment');
                    }
                } else {
                    // Payment not completed - show error
                    await set(paymentStatusRef, {
                        status: 'failed',
                        amount: Number(amount) || 0,
                        transactionId: transactionId || 'unknown',
                        message: `Payment status: ${paymentStatus || 'unknown'}`,
                        timestamp: Date.now()
                    });

                    setStatus('error');
                    setMessage(`Payment was not completed. Status: ${paymentStatus || 'unknown'}`);
                }

                // Close popup after brief delay
                setTimeout(() => {
                    window.close();
                }, 2500);
            } catch (error: any) {
                console.error('[VerifyPage] Verification error:', error);

                // Try to write error to RTDB
                try {
                    const walletIdParam = searchParams.get('walletId');
                    if (walletIdParam) {
                        const userId = walletIdParam.startsWith('user_')
                            ? walletIdParam.substring(5)
                            : walletIdParam;

                        const { realtimeDb } = await import('@/lib/firebase');
                        const { ref, set } = await import('firebase/database');
                        const paymentStatusRef = ref(realtimeDb, `payment_status/${userId}`);

                        await set(paymentStatusRef, {
                            status: 'error',
                            amount: 0,
                            message: error.message || 'Verification failed',
                            timestamp: Date.now()
                        });
                    }
                } catch (rtdbError) {
                    console.error('[VerifyPage] Failed to write error to RTDB:', rtdbError);
                }

                setStatus('error');
                setMessage(error.message || 'Payment verification failed');

                // Close popup after delay
                setTimeout(() => {
                    window.close();
                }, 3000);
            }
        };

        verifyPayment();
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-teal-950/20 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 p-8 max-w-md w-full text-center">
                {status === 'verifying' && (
                    <>
                        <Loader2 className="w-16 h-16 text-[#008080] animate-spin mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Verifying Payment
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {message}
                        </p>
                        <p className="text-sm text-gray-500 mt-4">
                            This window will close automatically...
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Payment Successful!
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {message}
                        </p>
                        <p className="text-sm text-gray-500 mt-4">
                            This window will close automatically...
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Verification Failed
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {message}
                        </p>
                        <button
                            onClick={() => window.close()}
                            className="px-6 py-3 bg-[#008080] hover:bg-teal-600 text-white font-bold rounded-xl transition-colors"
                        >
                            Close Window
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function PaymentVerifyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-16 h-16 text-[#008080] animate-spin" />
            </div>
        }>
            <VerifyContent />
        </Suspense>
    );
}

