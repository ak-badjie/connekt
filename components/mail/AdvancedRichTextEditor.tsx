'use client';

import { useState, useRef, useCallback } from 'react';
import {
    Bold,
    Italic,
    Underline,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Code,
    Link as LinkIcon,
    Image as ImageIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Undo,
    Redo,
    Eye,
    EyeOff
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AdvancedRichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    minHeight?: string;
}

export function AdvancedRichTextEditor({
    value,
    onChange,
    placeholder = 'Write your message...',
    minHeight = '300px'
}: AdvancedRichTextEditorProps) {
    const [showPreview, setShowPreview] = useState(false);
    const [history, setHistory] = useState<string[]>([value]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Save to history for undo/redo
    const saveToHistory = useCallback((newValue: string) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newValue);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    // Handle text change
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
        saveToHistory(newValue);
    };

    // Insert text at cursor position
    const insertAtCursor = (before: string, after: string = '', placeholder: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);
        const textToInsert = selectedText || placeholder;

        const newValue =
            value.substring(0, start) +
            before + textToInsert + after +
            value.substring(end);

        onChange(newValue);
        saveToHistory(newValue);

        // Set cursor position
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + before.length + textToInsert.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    // Insert text at start of line
    const insertAtLineStart = (prefix: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const lines = value.split('\n');
        let currentPos = 0;
        let lineIndex = 0;

        // Find which line the cursor is on
        for (let i = 0; i < lines.length; i++) {
            currentPos += lines[i].length + 1; // +1 for \n
            if (currentPos > start) {
                lineIndex = i;
                break;
            }
        }

        lines[lineIndex] = prefix + lines[lineIndex];
        const newValue = lines.join('\n');
        onChange(newValue);
        saveToHistory(newValue);

        textarea.focus();
    };

    // Formatting functions
    const formatBold = () => insertAtCursor('**', '**', 'bold text');
    const formatItalic = () => insertAtCursor('*', '*', 'italic text');
    const formatUnderline = () => insertAtCursor('<u>', '</u>', 'underlined text');
    const formatH1 = () => insertAtLineStart('# ');
    const formatH2 = () => insertAtLineStart('## ');
    const formatH3 = () => insertAtLineStart('### ');
    const formatBulletList = () => insertAtLineStart('- ');
    const formatNumberedList = () => insertAtLineStart('1. ');
    const formatQuote = () => insertAtLineStart('> ');
    const formatCode = () => insertAtCursor('`', '`', 'code');
    const formatCodeBlock = () => insertAtCursor('\n```\n', '\n```\n', 'code block');

    const insertLink = () => {
        const url = prompt('Enter URL:');
        if (url) {
            insertAtCursor('[', `](${url})`, 'link text');
        }
    };

    const insertImage = () => {
        const url = prompt('Enter image URL:');
        if (url) {
            insertAtCursor('![', `](${url})`, 'image description');
        }
    };

    // Undo/Redo
    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            onChange(history[newIndex]);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            onChange(history[newIndex]);
        }
    };

    const ToolbarButton = ({ onClick, icon: Icon, title, disabled = false }: any) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
            <Icon size={18} className="text-gray-600 dark:text-gray-400" />
        </button>
    );

    return (
        <div className="flex flex-col h-full border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-800">
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 dark:border-zinc-700 flex-wrap bg-gray-50 dark:bg-zinc-900">
                {/* Text Formatting */}
                <div className="flex items-center gap-0.5 pr-2 border-r border-gray-300 dark:border-zinc-700">
                    <ToolbarButton onClick={formatBold} icon={Bold} title="Bold (Ctrl+B)" />
                    <ToolbarButton onClick={formatItalic} icon={Italic} title="Italic (Ctrl+I)" />
                    <ToolbarButton onClick={formatUnderline} icon={Underline} title="Underline" />
                </div>

                {/* Headings */}
                <div className="flex items-center gap-0.5 pr-2 border-r border-gray-300 dark:border-zinc-700">
                    <ToolbarButton onClick={formatH1} icon={Heading1} title="Heading 1" />
                    <ToolbarButton onClick={formatH2} icon={Heading2} title="Heading 2" />
                    <ToolbarButton onClick={formatH3} icon={Heading3} title="Heading 3" />
                </div>

                {/* Lists */}
                <div className="flex items-center gap-0.5 pr-2 border-r border-gray-300 dark:border-zinc-700">
                    <ToolbarButton onClick={formatBulletList} icon={List} title="Bullet List" />
                    <ToolbarButton onClick={formatNumberedList} icon={ListOrdered} title="Numbered List" />
                    <ToolbarButton onClick={formatQuote} icon={Quote} title="Quote" />
                </div>

                {/* Code */}
                <div className="flex items-center gap-0.5 pr-2 border-r border-gray-300 dark:border-zinc-700">
                    <ToolbarButton onClick={formatCode} icon={Code} title="Inline Code" />
                </div>

                {/* Insert */}
                <div className="flex items-center gap-0.5 pr-2 border-r border-gray-300 dark:border-zinc-700">
                    <ToolbarButton onClick={insertLink} icon={LinkIcon} title="Insert Link" />
                    <ToolbarButton onClick={insertImage} icon={ImageIcon} title="Insert Image" />
                </div>

                {/* Undo/Redo */}
                <div className="flex items-center gap-0.5 pr-2 border-r border-gray-300 dark:border-zinc-700">
                    <ToolbarButton
                        onClick={undo}
                        icon={Undo}
                        title="Undo"
                        disabled={historyIndex === 0}
                    />
                    <ToolbarButton
                        onClick={redo}
                        icon={Redo}
                        title="Redo"
                        disabled={historyIndex === history.length - 1}
                    />
                </div>

                {/* Preview Toggle */}
                <div className="flex items-center gap-0.5">
                    <button
                        type="button"
                        onClick={() => setShowPreview(!showPreview)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showPreview
                            ? 'bg-[#008080] text-white'
                            : 'bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-gray-400'
                            }`}
                    >
                        {showPreview ? (
                            <span className="flex items-center gap-1">
                                <Eye size={14} /> Preview
                            </span>
                        ) : (
                            <span className="flex items-center gap-1">
                                <EyeOff size={14} /> Edit
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Editor/Preview Area */}
            <div className="flex-1 overflow-hidden" style={{ minHeight }}>
                {showPreview ? (
                    <div className="h-full overflow-y-auto p-4 prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{value || '*No content to preview*'}</ReactMarkdown>
                    </div>
                ) : (
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={handleChange}
                        placeholder={placeholder}
                        className="w-full h-full p-4 bg-transparent outline-none resize-none text-gray-900 dark:text-white placeholder-gray-400"
                        onKeyDown={(e) => {
                            // Handle keyboard shortcuts
                            if (e.ctrlKey || e.metaKey) {
                                switch (e.key.toLowerCase()) {
                                    case 'b':
                                        e.preventDefault();
                                        formatBold();
                                        break;
                                    case 'i':
                                        e.preventDefault();
                                        formatItalic();
                                        break;
                                    case 'z':
                                        if (e.shiftKey) {
                                            e.preventDefault();
                                            redo();
                                        } else {
                                            e.preventDefault();
                                            undo();
                                        }
                                        break;
                                }
                            }
                        }}
                    />
                )}
            </div>

            {/* Character Count */}
            <div className="px-4 py-2 border-t border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900">
                <span className="text-xs text-gray-500">
                    {value.length} characters
                </span>
            </div>
        </div>
    );
}
