'use client';

import { useState } from 'react';
import { MoreVertical, Eye, EyeOff, Edit, Trash2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProjectItemControlsProps {
    projectId: string;
    isVisible: boolean;
    isExternal?: boolean;
    onToggleVisibility: (id: string, visible: boolean) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
}

export function ProjectItemControls({
    projectId,
    isVisible,
    isExternal = false,
    onToggleVisibility,
    onEdit,
    onDelete,
}: ProjectItemControlsProps) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="relative">
            {/* Three-dot button */}
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="More options"
            >
                <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {showMenu && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowMenu(false)}
                        />

                        {/* Menu */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 py-2 z-50 overflow-hidden"
                        >
                            {/* Toggle Visibility */}
                            <button
                                onClick={() => {
                                    onToggleVisibility(projectId, !isVisible);
                                    setShowMenu(false);
                                }}
                                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors text-left"
                            >
                                {isVisible ? (
                                    <>
                                        <EyeOff className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Hide from Profile</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Only you can see this</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Show on Profile</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Make visible to others</p>
                                        </div>
                                    </>
                                )}
                            </button>

                            {/* Divider */}
                            <div className="h-px bg-gray-200 dark:bg-zinc-700 my-2" />

                            {/* Edit */}
                            {onEdit && (
                                <button
                                    onClick={() => {
                                        onEdit(projectId);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors text-left"
                                >
                                    <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">Edit Details</span>
                                </button>
                            )}

                            {/* External Project Indicator */}
                            {isExternal && (
                                <div className="px-4 py-2 flex items-center gap-2">
                                    <ExternalLink className="w-4 h-4 text-blue-500" />
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">External Project</span>
                                </div>
                            )}

                            {/* Delete (only for external projects or editable ones) */}
                            {onDelete && (
                                <>
                                    <div className="h-px bg-gray-200 dark:bg-zinc-700 my-2" />
                                    <button
                                        onClick={() => {
                                            if (confirm('Are you sure you want to remove this project from your profile?')) {
                                                onDelete(projectId);
                                                setShowMenu(false);
                                            }
                                        }}
                                        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                        <span className="text-sm font-medium text-red-600 dark:text-red-400">Remove from Profile</span>
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
