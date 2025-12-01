import { NextRequest, NextResponse } from 'next/server';
import { ModemPayService } from '@/lib/services/modem-pay-service';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { amount, walletId, returnUrl } = body;

        if (!amount || !walletId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await ModemPayService.initiatePayment(amount, 'GMD', walletId, returnUrl);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Top-up initiation error:', error);
        return NextResponse.json({ error: error.message || 'Failed to initiate top-up' }, { status: 500 });
    }
}
