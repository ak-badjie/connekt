'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Folder, FolderOpen, File, Image, Video, FileText, Music,
    ChevronRight, ChevronDown, HardDrive, Mail, Briefcase,
    Download, Eye
} from 'lucide-react';
import { getStorage, ref, listAll, getMetadata, getDownloadURL, StorageReference } from 'firebase/storage';

// ==========================================
// TYPES
// ==========================================

interface FileNode {
    name: string;
    path: string;
    type: 'folder' | 'file';
    size?: number;
    contentType?: string;
    updatedAt?: Date;
    children?: FileNode[];
    downloadUrl?: string;
}

interface FileExplorerProps {
    userId: string;
    username: string;
    className?: string;
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function getFileIcon(contentType?: string, name?: string) {
    if (!contentType && !name) return File;

    const type = contentType?.toLowerCase() || '';
    const ext = name?.split('.').pop()?.toLowerCase() || '';

    if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
        return Image;
    }
    if (type.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi'].includes(ext)) {
        return Video;
    }
    if (type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
        return Music;
    }
    if (type.includes('pdf') || ['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)) {
        return FileText;
    }
    return File;
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ==========================================
// FILE/FOLDER ROW COMPONENT
// ==========================================

interface FileRowProps {
    node: FileNode;
    depth: number;
    isExpanded: boolean;
    onToggle: () => void;
    onPreview?: (node: FileNode) => void;
}

function FileRow({ node, depth, isExpanded, onToggle, onPreview }: FileRowProps) {
    const isFolder = node.type === 'folder';
    const IconComponent = isFolder
        ? (isExpanded ? FolderOpen : Folder)
        : getFileIcon(node.contentType, node.name);

    const folderColors: Record<string, string> = {
        'mail': 'text-blue-500',
        'projects': 'text-purple-500',
        'profiles': 'text-teal-500',
        'contracts': 'text-amber-500',
        'default': 'text-gray-400'
    };

    const getFolderColor = () => {
        if (!isFolder) return 'text-gray-400';
        const lowerName = node.name.toLowerCase();
        for (const [key, color] of Object.entries(folderColors)) {
            if (lowerName.includes(key)) return color;
        }
        return folderColors.default;
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`group flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors hover:bg-white/50 dark:hover:bg-zinc-800/50`}
            style={{ paddingLeft: `${12 + depth * 20}px` }}
            onClick={() => isFolder ? onToggle() : onPreview?.(node)}
        >
            {/* Expand/Collapse Arrow */}
            {isFolder && (
                <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-4 h-4 flex items-center justify-center"
                >
                    <ChevronRight size={14} className="text-gray-400" />
                </motion.div>
            )}
            {!isFolder && <div className="w-4" />}

            {/* Icon */}
            <IconComponent
                size={18}
                className={isFolder ? getFolderColor() : 'text-gray-500'}
            />

            {/* Name */}
            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate font-medium">
                {node.name}
            </span>

            {/* Size */}
            {!isFolder && node.size !== undefined && (
                <span className="text-xs text-gray-400 font-mono">
                    {formatFileSize(node.size)}
                </span>
            )}

            {/* Actions */}
            {!isFolder && node.downloadUrl && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onPreview?.(node);
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                        title="Preview"
                    >
                        <Eye size={14} className="text-gray-500" />
                    </button>
                    <a
                        href={node.downloadUrl}
                        download={node.name}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                        title="Download"
                    >
                        <Download size={14} className="text-gray-500" />
                    </a>
                </div>
            )}
        </motion.div>
    );
}

// ==========================================
// FOLDER TREE COMPONENT (RECURSIVE)
// ==========================================

interface FolderTreeProps {
    nodes: FileNode[];
    depth?: number;
    expandedPaths: Set<string>;
    toggleExpand: (path: string) => void;
    onPreview?: (node: FileNode) => void;
}

function FolderTree({ nodes, depth = 0, expandedPaths, toggleExpand, onPreview }: FolderTreeProps) {
    // Sort: folders first, then files, both alphabetically
    const sortedNodes = [...nodes].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <>
            {sortedNodes.map((node) => {
                const isExpanded = expandedPaths.has(node.path);
                return (
                    <div key={node.path}>
                        <FileRow
                            node={node}
                            depth={depth}
                            isExpanded={isExpanded}
                            onToggle={() => toggleExpand(node.path)}
                            onPreview={onPreview}
                        />
                        <AnimatePresence>
                            {isExpanded && node.children && node.children.length > 0 && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <FolderTree
                                        nodes={node.children}
                                        depth={depth + 1}
                                        expandedPaths={expandedPaths}
                                        toggleExpand={toggleExpand}
                                        onPreview={onPreview}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </>
    );
}

// ==========================================
// MAIN FILE EXPLORER COMPONENT
// ==========================================

export default function FileExplorer({ userId, username, className = '' }: FileExplorerProps) {
    const [fileTree, setFileTree] = useState<FileNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
    const [previewFile, setPreviewFile] = useState<FileNode | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Build folder structure from user's storage paths
    const buildFileTree = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const storage = getStorage();
            const rootFolders = [
                { name: 'Mail Attachments', path: `mail/${username}` },
                { name: 'Profile Pictures', path: `profiles/users/${userId}/avatar` },
                { name: 'Profile Media', path: `profiles/users/${userId}` },
                { name: 'Projects', path: `profiles/users/${userId}/projects` },
            ];

            const tree: FileNode[] = [];

            for (const folder of rootFolders) {
                try {
                    const folderRef = ref(storage, folder.path);
                    const result = await listAll(folderRef);

                    const children: FileNode[] = [];

                    // Add subfolders
                    for (const prefix of result.prefixes) {
                        const subChildren = await loadFolderContents(prefix);
                        children.push({
                            name: prefix.name,
                            path: prefix.fullPath,
                            type: 'folder',
                            children: subChildren
                        });
                    }

                    // Add files
                    for (const item of result.items) {
                        try {
                            const metadata = await getMetadata(item);
                            const downloadUrl = await getDownloadURL(item);
                            children.push({
                                name: item.name,
                                path: item.fullPath,
                                type: 'file',
                                size: metadata.size,
                                contentType: metadata.contentType,
                                updatedAt: metadata.updated ? new Date(metadata.updated) : undefined,
                                downloadUrl
                            });
                        } catch {
                            // Skip files we can't access
                        }
                    }

                    if (children.length > 0) {
                        tree.push({
                            name: folder.name,
                            path: folder.path,
                            type: 'folder',
                            children
                        });
                    }
                } catch {
                    // Folder doesn't exist, skip
                }
            }

            setFileTree(tree);
            // Auto-expand root folders
            setExpandedPaths(new Set(tree.map(f => f.path)));
        } catch (err) {
            console.error('Error loading file tree:', err);
            setError('Unable to load files. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [userId, username]);

    // Recursively load folder contents
    const loadFolderContents = async (folderRef: StorageReference): Promise<FileNode[]> => {
        try {
            const result = await listAll(folderRef);
            const children: FileNode[] = [];

            // Subfolders
            for (const prefix of result.prefixes) {
                const subChildren = await loadFolderContents(prefix);
                children.push({
                    name: prefix.name,
                    path: prefix.fullPath,
                    type: 'folder',
                    children: subChildren
                });
            }

            // Files
            for (const item of result.items) {
                try {
                    const metadata = await getMetadata(item);
                    const downloadUrl = await getDownloadURL(item);
                    children.push({
                        name: item.name,
                        path: item.fullPath,
                        type: 'file',
                        size: metadata.size,
                        contentType: metadata.contentType,
                        downloadUrl
                    });
                } catch {
                    // Skip inaccessible files
                }
            }

            return children;
        } catch {
            return [];
        }
    };

    useEffect(() => {
        if (userId && username) {
            buildFileTree();
        }
    }, [userId, username, buildFileTree]);

    const toggleExpand = (path: string) => {
        setExpandedPaths(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };

    if (loading) {
        return (
            <div className={`flex items-center justify-center py-12 ${className}`}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-8 h-8 border-3 border-[#008080] border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
                <HardDrive size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-500">{error}</p>
            </div>
        );
    }

    if (fileTree.length === 0) {
        return (
            <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
                <HardDrive size={48} className="text-gray-300 mb-4" />
                <h4 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">No Files Yet</h4>
                <p className="text-sm text-gray-500 max-w-xs">
                    Your files will appear here once you upload attachments, media, or documents.
                </p>
            </div>
        );
    }

    return (
        <div className={className}>
            <FolderTree
                nodes={fileTree}
                expandedPaths={expandedPaths}
                toggleExpand={toggleExpand}
                onPreview={setPreviewFile}
            />

            {/* Simple Preview Modal */}
            <AnimatePresence>
                {previewFile && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-8"
                        onClick={() => setPreviewFile(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-2xl max-h-[80vh] overflow-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                {previewFile.name}
                            </h3>

                            {previewFile.contentType?.startsWith('image/') && previewFile.downloadUrl && (
                                <img
                                    src={previewFile.downloadUrl}
                                    alt={previewFile.name}
                                    className="max-w-full max-h-96 rounded-lg mx-auto"
                                />
                            )}

                            {previewFile.contentType?.startsWith('video/') && previewFile.downloadUrl && (
                                <video
                                    src={previewFile.downloadUrl}
                                    controls
                                    className="max-w-full max-h-96 rounded-lg mx-auto"
                                />
                            )}

                            <div className="mt-4 flex justify-between items-center">
                                <span className="text-sm text-gray-500">
                                    {previewFile.size && formatFileSize(previewFile.size)}
                                </span>
                                {previewFile.downloadUrl && (
                                    <a
                                        href={previewFile.downloadUrl}
                                        download={previewFile.name}
                                        className="px-4 py-2 bg-[#008080] text-white rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center gap-2"
                                    >
                                        <Download size={16} />
                                        Download
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
