import { NextRequest, NextResponse } from 'next/server';
import { WalletService } from '@/lib/services/wallet-service';
import { ModemPayService } from '@/lib/services/modem-pay-service';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { transactionId, walletId, amount } = body;

        if (!transactionId || !walletId) {
            return NextResponse.json({ error: 'Missing transactionId or walletId' }, { status: 400 });
        }

        console.log('Verifying payment:', { transactionId, walletId, amount });

        // Check payment status with Modem Pay
        const verification = await ModemPayService.verifyPayment(transactionId);
        const status = (verification?.status as string) || '';

        console.log('Verification result:', verification);

        if (status === 'success' || status === 'completed' || status === 'successful' || status === 'paid') {
            // Payment successful - update wallet
            const finalAmount = amount || verification?.amount || 0;

            await WalletService.updateBalance(walletId, Number(finalAmount));
            await WalletService.addTransaction(walletId, {
                walletId,
                type: 'deposit',
                amount: Number(finalAmount),
                currency: 'GMD',
                description: 'Wallet Top-up via Modem Pay (Wave)',
                status: 'completed',
                referenceId: transactionId
            });

            return NextResponse.json({
                success: true,
                status: 'completed',
                amount: finalAmount,
                message: `Wallet credited with GMD ${Number(finalAmount).toFixed(2)}`
            });
        } else if (status === 'pending' || status === 'requires_payment_method' || status === 'processing') {
            // Still pending
            return NextResponse.json({
                success: false,
                status: 'pending',
                message: 'Payment still processing'
            });
        } else {
            // Failed or unknown status
            return NextResponse.json({
                success: false,
                status: 'failed',
                message: `Payment status: ${status}`
            });
        }
    } catch (error: any) {
        console.error('Verification error:', error);
        return NextResponse.json({
            success: false,
            status: 'error',
            error: error.message || 'Verification failed'
        }, { status: 500 });
    }
}
