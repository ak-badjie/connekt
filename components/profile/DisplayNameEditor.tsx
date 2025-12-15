'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Loader2 } from 'lucide-react';

interface DisplayNameEditorProps {
    currentName: string;
    onSave: (newName: string) => Promise<void>;
    onCancel: () => void;
}

export function DisplayNameEditor({ currentName, onSave, onCancel }: DisplayNameEditorProps) {
    const [value, setValue] = useState(currentName);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        const trimmed = value.trim();

        if (!trimmed) {
            setError('Name cannot be empty');
            return;
        }

        if (trimmed.length > 50) {
            setError('Name must be 50 characters or less');
            return;
        }

        if (trimmed === currentName) {
            onCancel();
            return;
        }

        setSaving(true);
        setError(null);

        try {
            await onSave(trimmed);
        } catch (err) {
            setError('Failed to save. Please try again.');
            setSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !saving) {
            handleSave();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
        >
            <div className="flex-1">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={saving}
                    autoFocus
                    maxLength={51}
                    className="w-full text-4xl font-bold text-white bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-xl px-4 py-2 focus:outline-none focus:border-white/50 transition-colors placeholder-white/50 disabled:opacity-50"
                    placeholder="Enter your name"
                />
                {error && (
                    <p className="text-sm text-red-300 mt-2 drop-shadow">
                        {error}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-2">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="p-3 bg-green-500 hover:bg-green-600 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Save"
                >
                    {saving ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                        <Check className="w-5 h-5 text-white" />
                    )}
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onCancel}
                    disabled={saving}
                    className="p-3 bg-white/20 hover:bg-white/30 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Cancel"
                >
                    <X className="w-5 h-5 text-white" />
                </motion.button>
            </div>
        </motion.div>
    );
}
