'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, FileText, Briefcase, DollarSign, Clock, Edit2, Trash2 } from 'lucide-react';

// --- Types ---
interface JobStats {
    views: number;
    applicants: number;
}

interface JobDetails {
    title: string;
    payRate?: string;
    payType?: 'hourly' | 'fixed' | 'monthly';
    postedAt?: Date | string | { toDate: () => Date };
    description?: string;
}

interface FolderProps {
    color?: string;
    size?: number;
    label?: string;
    jobDetails?: JobDetails;
    stats?: JobStats;
    onEdit?: () => void;
    onDelete?: () => void;
    onClick?: () => void;
    className?: string;
}

// --- Utilities ---
const darkenColor = (hex: string, percent: number) => {
    let color = hex.startsWith('#') ? hex.slice(1) : hex;
    if (color.length === 3) {
        color = color
            .split('')
            .map(c => c + c)
            .join('');
    }
    const num = parseInt(color, 16);
    let r = (num >> 16) & 0xff;
    let g = (num >> 8) & 0xff;
    let b = num & 0xff;
    r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
    g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
    b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

const formatTimeAgo = (date: Date | string | { toDate: () => Date } | undefined): string => {
    if (!date) return 'Recently';

    const now = new Date();
    let postDate: Date;

    // Handle Firestore Timestamp objects (they have a toDate method)
    if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
        postDate = date.toDate();
    } else if (typeof date === 'string') {
        postDate = new Date(date);
    } else if (date instanceof Date) {
        postDate = date;
    } else {
        return 'Recently';
    }

    // Validate the date
    if (isNaN(postDate.getTime())) return 'Recently';

    const diffMs = now.getTime() - postDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
};

const formatPay = (payRate?: string, payType?: string): string => {
    if (!payRate) return 'Negotiable';
    const typeLabel = payType === 'hourly' ? '/hr' : payType === 'monthly' ? '/mo' : '';
    return `$${payRate}${typeLabel}`;
};

// --- Main Component ---
const Folder = ({
    color = '#0d9488',
    size = 1,
    label,
    jobDetails,
    stats,
    onEdit,
    onDelete,
    onClick,
    className = ''
}: FolderProps) => {
    const maxItems = 3;
    const [open, setOpen] = useState(false);
    const [paperOffsets, setPaperOffsets] = useState(Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })));

    const folderBackColor = darkenColor(color, 0.15);
    const paper1 = darkenColor('#ffffff', 0.08);
    const paper2 = darkenColor('#ffffff', 0.04);
    const paper3 = '#ffffff';

    const handleClick = () => {
        setOpen(prev => !prev);
        if (open) {
            setPaperOffsets(Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })));
        }
        if (!open && onClick) {
            onClick();
        }
    };

    const handlePaperMouseMove = (e: React.MouseEvent, index: number) => {
        if (!open) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const offsetX = (e.clientX - centerX) * 0.15;
        const offsetY = (e.clientY - centerY) * 0.15;
        setPaperOffsets(prev => {
            const newOffsets = [...prev];
            newOffsets[index] = { x: offsetX, y: offsetY };
            return newOffsets;
        });
    };

    const handlePaperMouseLeave = (index: number) => {
        setPaperOffsets(prev => {
            const newOffsets = [...prev];
            newOffsets[index] = { x: 0, y: 0 };
            return newOffsets;
        });
    };

    const folderStyle = {
        '--folder-color': color,
        '--folder-back-color': folderBackColor,
        '--paper-1': paper1,
        '--paper-2': paper2,
        '--paper-3': paper3
    } as React.CSSProperties;

    const scaleStyle = { transform: `scale(${size})`, transformOrigin: 'center bottom' };

    const getOpenTransform = (index: number) => {
        if (index === 0) return 'translate(-120%, -70%) rotate(-15deg)';
        if (index === 1) return 'translate(10%, -70%) rotate(15deg)';
        if (index === 2) return 'translate(-50%, -100%) rotate(5deg)';
        return '';
    };

    // Build paper contents
    const papers = [
        // Paper 1 (Left): Applicants
        <div key="applicants" className="flex flex-col items-center justify-center h-full w-full p-2 text-gray-800">
            <FileText size={18} className="mb-1.5 text-teal-600" />
            <div className="font-bold text-lg leading-none">{stats?.applicants ?? 0}</div>
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mt-1">Applicants</span>
        </div>,

        // Paper 2 (Right): Views
        <div key="views" className="flex flex-col items-center justify-center h-full w-full p-2 text-gray-800">
            <Eye size={18} className="mb-1.5 text-teal-600" />
            <div className="font-bold text-lg leading-none">{stats?.views ?? 0}</div>
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mt-1">Views</span>
        </div>,

        // Paper 3 (Center): Job details
        <div key="details" className="flex flex-col items-center justify-center h-full w-full p-2 text-center">
            <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-1.5">
                <Briefcase size={12} />
            </div>
            <h4 className="font-bold text-gray-900 text-[10px] leading-tight line-clamp-2 mb-1">
                {jobDetails?.title || label || 'Untitled'}
            </h4>
            <div className="flex items-center gap-1 text-[9px] text-teal-600 font-semibold">
                <DollarSign size={10} />
                {formatPay(jobDetails?.payRate, jobDetails?.payType)}
            </div>
            <div className="flex items-center gap-1 text-[8px] text-gray-400 mt-0.5">
                <Clock size={8} />
                {formatTimeAgo(jobDetails?.postedAt)}
            </div>
        </div>
    ];

    return (
        <div style={scaleStyle} className={`relative flex flex-col items-center ${className}`}>
            {/* Folder Container */}
            <div
                className={`group relative transition-all duration-200 ease-in cursor-pointer ${!open ? 'hover:-translate-y-2' : ''}`}
                style={{
                    ...folderStyle,
                    transform: open ? 'translateY(-8px)' : undefined
                }}
                onClick={handleClick}
            >
                {/* Action buttons when open */}
                <AnimatePresence>
                    {open && (onEdit || onDelete) && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute -top-28 left-1/2 -translate-x-1/2 flex gap-2 z-50"
                        >
                            {onEdit && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                                    className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 text-gray-700 border border-gray-100 transition-colors"
                                >
                                    <Edit2 size={14} />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                    className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50 text-red-500 border border-gray-100 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div
                    className="relative w-[100px] h-[80px] rounded-tl-0 rounded-tr-[10px] rounded-br-[10px] rounded-bl-[10px]"
                    style={{ backgroundColor: folderBackColor }}
                >
                    {/* Tab */}
                    <span
                        className="absolute z-0 bottom-[98%] left-0 w-[30px] h-[10px] rounded-tl-[5px] rounded-tr-[5px] rounded-bl-0 rounded-br-0"
                        style={{ backgroundColor: folderBackColor }}
                    ></span>

                    {/* Papers */}
                    {papers.map((item, i) => {
                        let sizeClasses = '';
                        if (i === 0) sizeClasses = open ? 'w-[70px] h-[85px]' : 'w-[70%] h-[80%]';
                        if (i === 1) sizeClasses = open ? 'w-[70px] h-[85px]' : 'w-[80%] h-[70%]';
                        if (i === 2) sizeClasses = open ? 'w-[85px] h-[75px]' : 'w-[90%] h-[60%]';

                        const transformStyle = open
                            ? `${getOpenTransform(i)} translate(${paperOffsets[i].x}px, ${paperOffsets[i].y}px)`
                            : undefined;

                        return (
                            <div
                                key={i}
                                onMouseMove={e => handlePaperMouseMove(e, i)}
                                onMouseLeave={() => handlePaperMouseLeave(i)}
                                className={`absolute z-20 bottom-[10%] left-1/2 transition-all duration-300 ease-in-out shadow-sm border border-gray-100 overflow-hidden ${!open ? 'transform -translate-x-1/2 translate-y-[10%] group-hover:translate-y-0' : 'hover:scale-110'
                                    } ${sizeClasses}`}
                                style={{
                                    ...(!open ? {} : { transform: transformStyle }),
                                    backgroundColor: i === 0 ? paper1 : i === 1 ? paper2 : paper3,
                                    borderRadius: '8px'
                                }}
                            >
                                {item}
                            </div>
                        );
                    })}

                    {/* Front Flaps */}
                    <div
                        className={`absolute z-30 w-full h-full origin-bottom transition-all duration-300 ease-in-out ${!open ? 'group-hover:[transform:skew(15deg)_scaleY(0.6)]' : ''
                            }`}
                        style={{
                            backgroundColor: color,
                            borderRadius: '5px 10px 10px 10px',
                            ...(open && { transform: 'skew(15deg) scaleY(0.6)' })
                        }}
                    ></div>
                    <div
                        className={`absolute z-30 w-full h-full origin-bottom transition-all duration-300 ease-in-out ${!open ? 'group-hover:[transform:skew(-15deg)_scaleY(0.6)]' : ''
                            }`}
                        style={{
                            backgroundColor: color,
                            borderRadius: '5px 10px 10px 10px',
                            ...(open && { transform: 'skew(-15deg) scaleY(0.6)' })
                        }}
                    >
                        {/* ConnektIcon placeholder - briefcase decoration */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-25">
                            <Briefcase className="text-white w-8 h-8" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Label below folder */}
            {label && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-center max-w-[120px]"
                >
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{label}</h4>
                    {jobDetails?.payRate && (
                        <span className="text-xs text-teal-600 font-medium">
                            {formatPay(jobDetails.payRate, jobDetails.payType)}
                        </span>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default Folder;
