'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, Trash2 } from 'lucide-react';

interface SortableSectionProps {
    id: string;
    title: string;
    type: 'default' | 'custom';
}

export function SortableSection({ id, title, type }: SortableSectionProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
                <GripVertical className="w-5 h-5" />
            </div>

            {/* Section Info */}
            <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {type === 'default' ? 'Built-in section' : 'Custom section'}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <button
                    className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                    title="Toggle visibility"
                >
                    <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                {type === 'custom' && (
                    <button
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete section"
                    >
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                )}
            </div>
        </div>
    );
}
