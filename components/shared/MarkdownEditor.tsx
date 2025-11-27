'use client';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Tell us about yourself... (Markdown supported)"
            className="w-full h-32 bg-black/20 border border-white/10 rounded-xl p-4 outline-none focus:border-amber-500/50 transition-all resize-none text-white placeholder-gray-600"
        />
    );
}
