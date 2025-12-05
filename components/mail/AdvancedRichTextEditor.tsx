'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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
    Undo,
    Redo
} from 'lucide-react';

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
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Initialize editor content
    useEffect(() => {
        if (editorRef.current && !isFocused) {
            // Convert value to HTML (assuming it might be markdown)
            // For now, just set it as is. In production, you might want to convert markdown to HTML
            editorRef.current.innerHTML = value || '';
        }
    }, [value, isFocused]);

    const handleInput = () => {
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            onChange(html);
        }
    };

    const execCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            editorRef.current.focus();
        }
        handleInput();
    };

    const formatBold = () => execCommand('bold');
    const formatItalic = () => execCommand('italic');
    const formatUnderline = () => execCommand('underline');
    const formatH1 = () => execCommand('formatBlock', 'H1');
    const formatH2 = () => execCommand('formatBlock', 'H2');
    const formatH3 = () => execCommand('formatBlock', 'H3');
    const formatBulletList = () => execCommand('insertUnorderedList');
    const formatNumberedList = () => execCommand('insertOrderedList');
    const formatQuote = () => execCommand('formatBlock', 'BLOCKQUOTE');

    const insertLink = () => {
        const url = prompt('Enter URL:');
        if (url) {
            execCommand('createLink', url);
        }
    };

    const insertImage = () => {
        const url = prompt('Enter image URL:');
        if (url) {
            execCommand('insertImage', url);
        }
    };

    const undo = () => execCommand('undo');
    const redo = () => execCommand('redo');

    const ToolbarButton = ({ onClick, icon: Icon, title }: any) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            onMouseDown={(e) => e.preventDefault()} // Prevent losing focus
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
                    <ToolbarButton onClick={formatUnderline} icon={Underline} title="Underline (Ctrl+U)" />
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

                {/* Insert */}
                <div className="flex items-center gap-0.5 pr-2 border-r border-gray-300 dark:border-zinc-700">
                    <ToolbarButton onClick={insertLink} icon={LinkIcon} title="Insert Link" />
                    <ToolbarButton onClick={insertImage} icon={ImageIcon} title="Insert Image" />
                </div>

                {/* Undo/Redo */}
                <div className="flex items-center gap-0.5">
                    <ToolbarButton onClick={undo} icon={Undo} title="Undo (Ctrl+Z)" />
                    <ToolbarButton onClick={redo} icon={Redo} title="Redo (Ctrl+Y)" />
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-hidden" style={{ minHeight }}>
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="w-full h-full p-4 outline-none resize-none text-gray-900 dark:text-white prose prose-sm dark:prose-invert max-w-none overflow-y-auto"
                    style={{
                        minHeight: minHeight,
                        cursor: 'text'
                    }}
                    data-placeholder={placeholder}
                    suppressContentEditableWarning
                />
            </div>

            {/* Character Count - Count text content, not HTML */}
            <div className="px-4 py-2 border-t border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900">
                <span className="text-xs text-gray-500">
                    {editorRef.current?.textContent?.length || 0} characters
                </span>
            </div>

            <style jsx>{`
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    pointer-events: none;
                    position: absolute;
                }
                [contenteditable] h1 {
                    font-size: 2em;
                    font-weight: bold;
                    margin: 0.67em 0;
                    line-height: 1.2;
                }
                [contenteditable] h2 {
                    font-size: 1.5em;
                    font-weight: bold;
                    margin: 0.75em 0;
                    line-height: 1.3;
                }
                [contenteditable] h3 {
                    font-size: 1.17em;
                    font-weight: bold;
                    margin: 0.83em 0;
                    line-height: 1.4;
                }
                [contenteditable] blockquote {
                    border-left: 4px solid #d1d5db;
                    padding-left: 1em;
                    margin: 1em 0;
                    font-style: italic;
                    color: #6b7280;
                }
                [contenteditable] ul {
                    list-style-type: disc !important;
                    padding-left: 2em !important;
                    margin: 1em 0;
                }
                [contenteditable] ol {
                    list-style-type: decimal !important;
                    padding-left: 2em !important;
                    margin: 1em 0;
                }
                [contenteditable] li {
                    display: list-item;
                }
                [contenteditable] a {
                    color: #3b82f6;
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
}
