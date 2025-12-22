"use client"

import { useEffect, useState } from "react"
import {
    Bell,
    Mail,
    MessageCircle,
    Wallet,
    HardDrive,
    Cpu,
    FileText,
    Briefcase,
    CheckCircle,
    AlertTriangle,
    X
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import type { Notification, NotificationType } from "@/lib/types/notification.types"

interface NotificationDynamicIslandProps {
    notification: Notification | null
    onDismiss: () => void
    autoDismissMs?: number
}

const getNotificationIcon = (type: NotificationType) => {
    const iconClass = "h-5 w-5"
    switch (type) {
        case 'mail':
            return <Mail className={`${iconClass} text-blue-400`} />
        case 'message':
            return <MessageCircle className={`${iconClass} text-cyan-400`} />
        case 'transaction':
            return <Wallet className={`${iconClass} text-green-400`} />
        case 'storage':
            return <HardDrive className={`${iconClass} text-orange-400`} />
        case 'ai_quota':
            return <Cpu className={`${iconClass} text-purple-400`} />
        case 'proposal':
        case 'contract':
            return <FileText className={`${iconClass} text-amber-400`} />
        case 'project':
        case 'task':
        case 'workspace':
            return <Briefcase className={`${iconClass} text-indigo-400`} />
        default:
            return <Bell className={`${iconClass} text-teal-400`} />
    }
}

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'urgent':
            return 'border-red-500 bg-red-500/10'
        case 'high':
            return 'border-amber-500 bg-amber-500/10'
        case 'medium':
            return 'border-teal-500 bg-teal-500/10'
        default:
            return 'border-gray-500 bg-gray-500/10'
    }
}

export function NotificationDynamicIsland({
    notification,
    onDismiss,
    autoDismissMs = 5000
}: NotificationDynamicIslandProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    useEffect(() => {
        if (notification) {
            // Auto-dismiss after timeout
            const timer = setTimeout(() => {
                onDismiss()
            }, autoDismissMs)

            return () => clearTimeout(timer)
        }
    }, [notification, autoDismissMs, onDismiss])

    useEffect(() => {
        if (notification) {
            // Start expanded, then collapse
            setIsExpanded(true)
            const collapseTimer = setTimeout(() => {
                setIsExpanded(false)
            }, 2500)

            return () => clearTimeout(collapseTimer)
        }
    }, [notification])

    if (!notification) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 z-[100000]"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <motion.div
                    layout
                    className={`
                        rounded-full bg-black/95 backdrop-blur-xl
                        border-2 ${getPriorityColor(notification.priority)}
                        shadow-2xl shadow-black/50
                        cursor-pointer overflow-hidden
                    `}
                    animate={{
                        width: isExpanded ? 340 : 200,
                        height: isExpanded ? 100 : 44,
                        borderRadius: isExpanded ? 24 : 22
                    }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                >
                    {/* Compact State */}
                    <AnimatePresence mode="wait">
                        {!isExpanded ? (
                            <motion.div
                                key="compact"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center justify-between h-full px-4"
                            >
                                <div className="flex items-center gap-2">
                                    {getNotificationIcon(notification.type)}
                                    <span className="text-white text-sm font-medium truncate max-w-[120px]">
                                        {notification.title}
                                    </span>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="expanded"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="p-4 h-full flex flex-col justify-between"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-teal-500/20">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold text-sm">
                                                {notification.title}
                                            </h3>
                                            <p className="text-gray-400 text-xs line-clamp-1">
                                                {notification.message}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onDismiss()
                                        }}
                                        className="text-gray-500 hover:text-white transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                {notification.actionUrl && (
                                    <motion.a
                                        href={notification.actionUrl}
                                        onClick={(e) => e.stopPropagation()}
                                        className="
                                            mt-2 text-xs font-medium text-teal-400 
                                            hover:text-teal-300 transition-colors
                                            flex items-center gap-1
                                        "
                                    >
                                        {notification.actionLabel || 'View'} →
                                    </motion.a>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

export default NotificationDynamicIsland
