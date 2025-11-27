'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, Check, X } from 'lucide-react';

interface UsernameInputProps {
    value: string;
    onChange: (value: string) => void;
    onValidityChange: (isValid: boolean) => void;
}

export function UsernameInput({ value, onChange, onValidityChange }: UsernameInputProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isAvailable, setIsAvailable] = useState(false);

    useEffect(() => {
        const checkUsername = async () => {
            if (value.length < 3) {
                setError('Username must be at least 3 characters');
                setIsAvailable(false);
                onValidityChange(false);
                return;
            }

            const regex = /^[a-zA-Z0-9_]+$/;
            if (!regex.test(value)) {
                setError('Only letters, numbers, and underscores allowed');
                setIsAvailable(false);
                onValidityChange(false);
                return;
            }

            setLoading(true);
            try {
                const docRef = doc(db, 'usernames', value.toLowerCase());
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setError('Username is taken');
                    setIsAvailable(false);
                    onValidityChange(false);
                } else {
                    setError('');
                    setIsAvailable(true);
                    onValidityChange(true);
                }
            } catch (err) {
                console.error('Error checking username:', err);
                setError('Error checking availability');
                setIsAvailable(false);
                onValidityChange(false);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            if (value) checkUsername();
            else {
                setError('');
                setIsAvailable(false);
                onValidityChange(false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [value, onValidityChange]);

    return (
        <div className="relative">
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="@username"
                className={`w-full bg-black/20 border rounded-xl p-4 outline-none transition-all ${error ? 'border-red-500/50 focus:border-red-500' :
                        isAvailable ? 'border-green-500/50 focus:border-green-500' :
                            'border-white/10 focus:border-amber-500/50'
                    }`}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {loading ? (
                    <Loader2 className="animate-spin text-amber-500" size={20} />
                ) : isAvailable ? (
                    <Check className="text-green-500" size={20} />
                ) : error ? (
                    <X className="text-red-500" size={20} />
                ) : null}
            </div>
            {error && <p className="text-red-400 text-xs mt-1 ml-1">{error}</p>}
            {isAvailable && <p className="text-green-400 text-xs mt-1 ml-1">Username is available</p>}
        </div>
    );
}
