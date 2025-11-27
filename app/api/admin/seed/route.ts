import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const codesRef = collection(db, 'invite_codes');

        // 1. Check if we already have unused codes (to prevent duplicates)
        const q = query(codesRef, where('used', '==', false), where('role', '==', 'super_admin'));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const existingCode = snapshot.docs[0].data().code;
            return NextResponse.json({
                message: 'Active Master Code already exists',
                code: existingCode
            });
        }

        // 2. Generate the Master Code
        const masterCode = `MASTER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // 3. Save to Firestore
        await addDoc(codesRef, {
            code: masterCode,
            role: 'super_admin',
            used: false,
            createdAt: serverTimestamp(),
            createdBy: 'SYSTEM_SEED'
        });

        return NextResponse.json({
            success: true,
            message: 'Master Code Generated. Use this to register the first admin.',
            code: masterCode
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
