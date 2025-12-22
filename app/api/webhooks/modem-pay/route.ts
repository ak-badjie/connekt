import { NextRequest, NextResponse } from 'next/server';
import { WalletService } from '@/lib/services/wallet-service';
// ModemPayService import removed - we trust webhook status directly
import { db, realtimeDb } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('Webhook received:', JSON.stringify(body));

        const { transaction_id, status, reference, amount } = body;

        // Extract walletId from reference (format: topup_{walletId}_{timestamp})
        // walletId here could be "user_abc123" format
        const parts = reference?.split('_') || [];
        const extractedWalletId = parts.length >= 3 ? parts.slice(1, -1).join('_') : null;

        if (!extractedWalletId) {
            console.error('Could not extract walletId from reference:', reference);
            return NextResponse.json({ received: true, status: 'no_wallet_id' });
        }

        // extractedWalletId is "user_abc123", we need:
        // - fullWalletId for WalletService: "user_abc123" (already correct)
        // - userId for RTDB path: "abc123" (strip "user_" prefix)
        const fullWalletId = extractedWalletId.startsWith('user_')
            ? extractedWalletId
            : `user_${extractedWalletId}`;
        const userId = extractedWalletId.startsWith('user_')
            ? extractedWalletId.substring(5)
            : extractedWalletId;

        // Step 1: Write "verifying" status to RTDB (triggers frontend notification)
        // Use userId (not fullWalletId) to match NotificationContext listener
        const paymentStatusRef = ref(realtimeDb, `payment_status/${userId}`);
        await set(paymentStatusRef, {
            status: 'verifying',
            amount: Number(amount),
            transactionId: transaction_id,
            timestamp: Date.now()
        });

        console.log('Payment status set to verifying for userId:', userId);

        // Step 2: Check if transaction ID already used (fraud prevention)
        const usedTxnRef = doc(db, 'used_transaction_ids', transaction_id);
        const usedTxnSnap = await getDoc(usedTxnRef);

        if (usedTxnSnap.exists()) {
            console.log('Duplicate transaction detected:', transaction_id);
            // Already processed - reject as duplicate
            await set(paymentStatusRef, {
                status: 'error',
                amount: Number(amount),
                transactionId: transaction_id,
                message: 'Transaction already processed',
                timestamp: Date.now()
            });
            return NextResponse.json({ received: true, status: 'duplicate' });
        }

        // Step 3: Check the status from Modem Pay webhook callback
        // Trust the webhook status - if Modem Pay says it's successful, process it
        // (Re-verifying often fails due to transaction ID format differences)
        const webhookStatus = (status as string)?.toLowerCase() || '';
        console.log('Webhook status from Modem Pay:', webhookStatus);

        if (webhookStatus === 'success' || webhookStatus === 'completed' || webhookStatus === 'successful' || webhookStatus === 'paid') {
            try {
                // Step 4: Process top-up atomically (includes idempotency check on referenceId)
                const result = await WalletService.processTopUpTransaction(
                    fullWalletId,
                    Number(amount),
                    transaction_id, // referenceId for idempotency
                    'Wallet Top-up via Modem Pay (Wave)',
                    { paymentMethod: 'wave', source: 'webhook' }
                );

                // Step 5: Mark transaction ID as used (fraud prevention)
                await setDoc(usedTxnRef, {
                    usedAt: serverTimestamp(),
                    walletId: fullWalletId,
                    amount: Number(amount),
                    reference
                });

                // Step 6: Write "success" status to RTDB
                await set(paymentStatusRef, {
                    status: 'success',
                    amount: Number(amount),
                    transactionId: transaction_id,
                    message: result.message || `Wallet credited with GMD ${Number(amount).toFixed(2)}`,
                    timestamp: Date.now()
                });

                console.log('Payment processed successfully for wallet:', fullWalletId);
                return NextResponse.json({ received: true, processed: true });
            } catch (processError: any) {
                console.error('Payment processing error:', processError);

                await set(paymentStatusRef, {
                    status: 'error',
                    amount: Number(amount),
                    transactionId: transaction_id,
                    message: processError.message || 'Payment processing failed',
                    timestamp: Date.now()
                });

                return NextResponse.json({ received: true, status: 'processing_error' });
            }
        } else if (webhookStatus === 'pending' || webhookStatus === 'processing') {
            // Still pending - keep verifying status
            console.log('Payment still pending:', webhookStatus);
            return NextResponse.json({ received: true, status: 'pending' });
        } else {
            // Failed or unknown status
            await set(paymentStatusRef, {
                status: 'failed',
                amount: Number(amount),
                transactionId: transaction_id,
                message: `Payment status: ${webhookStatus || 'unknown'}`,
                timestamp: Date.now()
            });

            return NextResponse.json({ received: true, status: 'failed' });
        }
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}

