'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableSectionProps {
    id: string;
    children: React.ReactNode;
    isOwner: boolean;
    onRemove?: () => void;
    className?: string;
    title?: string; // For accessibility/labels
}

export function DraggableSection({
    id,
    children,
    isOwner,
    onRemove,
    className,
    title
}: DraggableSectionProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as const,
    };

    if (!isOwner) {
        return (
            <div className={className}>
                {children}
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative rounded-2xl border-2 border-transparent transition-all",
                isDragging ? "bg-white dark:bg-zinc-900 shadow-xl border-teal-500/50 scale-[1.02]" : "hover:border-dashed hover:border-gray-300 dark:hover:border-zinc-700",
                className
            )}
        >
            {/* Drag Handle & Controls - Visible on Hover or when Dragging */}
            <div className={cn(
                "absolute -left-10 top-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity",
                isDragging && "opacity-100"
            )}>
                <button
                    {...attributes}
                    {...listeners}
                    className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 cursor-grab active:cursor-grabbing hover:text-teal-600"
                    title={`Drag ${title || 'section'}`}
                >
                    <GripVertical size={16} />
                </button>

                {onRemove && (
                    <button
                        onClick={onRemove}
                        className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Remove section"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            {children}
        </div>
    );
}
