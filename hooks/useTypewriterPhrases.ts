import { useEffect, useState } from 'react';

type UseTypewriterPhrasesOptions = {
    phrases: string[];
    enabled?: boolean;
    typingDelayMs?: number;
    deletingDelayMs?: number;
    pauseAfterTypedMs?: number;
    pauseAfterDeletedMs?: number;
    resetOnPhrasesChange?: boolean;
};

export function useTypewriterPhrases({
    phrases,
    enabled = true,
    typingDelayMs = 36,
    deletingDelayMs = 28,
    pauseAfterTypedMs = 900,
    pauseAfterDeletedMs = 320,
    resetOnPhrasesChange = true,
}: UseTypewriterPhrasesOptions) {
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [text, setText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!resetOnPhrasesChange) return;
        setPhraseIndex(0);
        setText('');
        setIsDeleting(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resetOnPhrasesChange, phrases.join('\n')]);

    useEffect(() => {
        if (!enabled) return;
        if (phrases.length === 0) return;

        const full = phrases[phraseIndex] ?? '';
        const nextText = isDeleting
            ? full.slice(0, Math.max(0, text.length - 1))
            : full.slice(0, text.length + 1);

        const isDoneTyping = !isDeleting && nextText.length === full.length;
        const isDoneDeleting = isDeleting && nextText.length === 0;

        const baseDelay = isDeleting ? deletingDelayMs : typingDelayMs;
        const pauseDelay = isDoneTyping ? pauseAfterTypedMs : isDoneDeleting ? pauseAfterDeletedMs : 0;

        const id = window.setTimeout(() => {
            setText(nextText);
            if (isDoneTyping) setIsDeleting(true);
            if (isDoneDeleting) {
                setIsDeleting(false);
                setPhraseIndex((i) => (i + 1) % phrases.length);
            }
        }, baseDelay + pauseDelay);

        return () => window.clearTimeout(id);
    }, [enabled, phrases, phraseIndex, isDeleting, text, typingDelayMs, deletingDelayMs, pauseAfterTypedMs, pauseAfterDeletedMs]);

    return { text, phraseIndex, isDeleting };
}
