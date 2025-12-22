import { NextRequest, NextResponse } from 'next/server';
import { WalletService } from '@/lib/services/wallet-service';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { walletId, amount, transactionId, reference } = body;

        console.log('[ProcessPayment] Processing payment:', { walletId, amount, transactionId, reference });

        if (!walletId || !amount) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // Check if transaction ID already used (fraud prevention)
        if (transactionId) {
            const usedTxnRef = doc(db, 'used_transaction_ids', transactionId);
            const usedTxnSnap = await getDoc(usedTxnRef);

            if (usedTxnSnap.exists()) {
                console.log('[ProcessPayment] Duplicate transaction detected:', transactionId);
                return NextResponse.json({
                    success: false,
                    error: 'Transaction already processed',
                    duplicate: true
                });
            }

            // Process the top-up atomically
            const result = await WalletService.processTopUpTransaction(
                walletId,
                Number(amount),
                transactionId, // referenceId for idempotency
                'Wallet Top-up via Modem Pay (Wave)',
                { paymentMethod: 'wave', source: 'return_url' }
            );

            // Mark transaction ID as used
            await setDoc(usedTxnRef, {
                usedAt: serverTimestamp(),
                walletId: walletId,
                amount: Number(amount),
                reference: reference || transactionId
            });

            console.log('[ProcessPayment] Payment processed successfully:', result);

            return NextResponse.json({
                success: true,
                message: result.message || `Wallet credited with GMD ${Number(amount).toFixed(2)}`,
                newBalance: result.newBalance
            });
        } else {
            // No transaction ID - use reference as fallback
            const result = await WalletService.processTopUpTransaction(
                walletId,
                Number(amount),
                reference || `manual_${Date.now()}`,
                'Wallet Top-up via Modem Pay (Wave)',
                { paymentMethod: 'wave', source: 'return_url_no_txn' }
            );

            console.log('[ProcessPayment] Payment processed (no txn ID):', result);

            return NextResponse.json({
                success: true,
                message: result.message || `Wallet credited with GMD ${Number(amount).toFixed(2)}`,
                newBalance: result.newBalance
            });
        }
    } catch (error: any) {
        console.error('[ProcessPayment] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to process payment'
        }, { status: 500 });
    }
}
