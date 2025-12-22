"use client"

import React, { useEffect, useState } from "react"
import { useNotifications } from "@/context/NotificationContext"
import {
    DynamicIsland,
    DynamicIslandProvider,
    DynamicContainer,
    DynamicTitle,
    DynamicDescription,
    DynamicDiv,
    useDynamicIslandSize,
    SizePresets
} from "@/components/ui/dynamic-island"
import {
    Bell,
    Mail,
    MessageCircle,
    Wallet,
    CheckCircle,
    AlertTriangle,
    X,
    Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

function IslandContent() {
    const { dynamicIslandNotification, dismissDynamicIsland, markAsRead, pendingPaymentNotification, dismissPendingPayment } = useNotifications()
    const { state, setSize } = useDynamicIslandSize()
    const router = useRouter()
    const [viewState, setViewState] = useState<"idle" | "incoming" | "expanded">("idle")

    // Handle pending payment notification (takes priority)
    useEffect(() => {
        if (pendingPaymentNotification) {
            setViewState("expanded")
            setSize("long")
            return
        }
    }, [pendingPaymentNotification, setSize])

    useEffect(() => {
        if (dynamicIslandNotification && !pendingPaymentNotification) {
            setViewState("incoming")
            setSize("compact")

            // Auto-expand after brief delay
            const expandTimer = setTimeout(() => {
                setViewState("expanded")
                // Choose size based on content length
                if (dynamicIslandNotification.message.length > 50 || dynamicIslandNotification.actionUrl) {
                    setSize("medium")
                } else {
                    setSize("long")
                }
            }, 600)

            return () => clearTimeout(expandTimer)
        } else if (!pendingPaymentNotification) {
            // When notification clears, go back to compact then idle
            if (viewState !== "idle") {
                setSize("compact")
                const idleTimer = setTimeout(() => {
                    setViewState("idle")
                }, 300)
                return () => clearTimeout(idleTimer)
            }
        }
    }, [dynamicIslandNotification, pendingPaymentNotification, setSize])

    // Show nothing if no notifications
    if (!dynamicIslandNotification && !pendingPaymentNotification && viewState === "idle") return null

    // Render pending payment notification
    if (pendingPaymentNotification) {
        const isVerifying = pendingPaymentNotification.status === 'verifying'
        const isSuccess = pendingPaymentNotification.status === 'success'

        return (
            <div className="fixed top-4 left-0 right-0 flex justify-center z-[100000] pointer-events-none">
                <div className="pointer-events-auto">
                    <DynamicIsland>
                        <DynamicContainer className="flex items-center justify-between px-4 py-4 h-full w-full">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full ${isSuccess ? 'bg-green-500/20' : 'bg-cyan-500/20'}`}>
                                    {isVerifying ? (
                                        <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
                                    ) : (
                                        <CheckCircle className="h-5 w-5 text-green-400" />
                                    )}
                                </div>
                                <div>
                                    <DynamicTitle className="text-base leading-tight">
                                        {isVerifying ? 'Verifying Payment...' : 'Payment Successful!'}
                                    </DynamicTitle>
                                    <DynamicDescription className="text-sm opacity-70">
                                        {isVerifying
                                            ? `Processing GMD ${pendingPaymentNotification.amount.toFixed(2)}`
                                            : pendingPaymentNotification.message || `Wallet credited with GMD ${pendingPaymentNotification.amount.toFixed(2)}`
                                        }
                                    </DynamicDescription>
                                </div>
                            </div>
                            {isSuccess && (
                                <button onClick={dismissPendingPayment} className="text-white/50 hover:text-white">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </DynamicContainer>
                    </DynamicIsland>
                </div>
            </div>
        )
    }

    // Safe fallback if notification is null but we are animating out
    const notification = dynamicIslandNotification || {
        id: 'fallback',
        title: "Notification",
        message: "",
        type: "system" as const,
        priority: "medium" as const,
        read: true,
        createdAt: Date.now(),
        userId: 'system',
        actionUrl: '',
        actionLabel: ''
    }

    const handleAction = () => {
        if (dynamicIslandNotification?.actionUrl) {
            router.push(dynamicIslandNotification.actionUrl)
            markAsRead(dynamicIslandNotification.id)
        }
        dismissDynamicIsland()
    }

    const handleDismiss = () => {
        dismissDynamicIsland()
    }

    const renderIcon = () => {
        const className = "h-5 w-5 text-cyan-400"
        switch (notification.type) {
            case 'mail': return <Mail className={className} />
            case 'message': return <MessageCircle className={className} />
            case 'transaction': return <Wallet className="h-5 w-5 text-green-400" />
            default: return <Bell className={className} />
        }
    }

    const renderCompact = () => (
        <DynamicContainer className="flex items-center justify-center h-full w-full px-4">
            <div className="flex items-center gap-3 w-full">
                {renderIcon()}
                <span className="text-sm font-medium text-white truncate flex-1">
                    {notification.title}
                </span>
            </div>
        </DynamicContainer>
    )

    const renderExpanded = () => (
        <DynamicContainer className="flex flex-col justify-between px-4 py-4 h-full w-full">
            <div className="flex items-start gap-4">
                <div className="mt-1 p-2 rounded-full bg-white/10">
                    {renderIcon()}
                </div>
                <div className="flex-1 min-w-0">
                    <DynamicTitle className="text-lg leading-tight mb-1">
                        {notification.title}
                    </DynamicTitle>
                    <DynamicDescription className="line-clamp-2">
                        {notification.message}
                    </DynamicDescription>
                </div>
                <button onClick={handleDismiss} className="text-white/50 hover:text-white">
                    <X className="h-4 w-4" />
                </button>
            </div>

            {notification.actionUrl && (
                <DynamicDiv className="mt-auto pt-2 flex gap-2">
                    <Button
                        size="sm"
                        variant="secondary"
                        className="w-full bg-white/10 hover:bg-white/20 text-white border-0"
                        onClick={handleAction}
                    >
                        View Details
                    </Button>
                </DynamicDiv>
            )}
        </DynamicContainer>
    )

    return (
        <div className="fixed top-4 left-0 right-0 flex justify-center z-[100000] pointer-events-none">
            <div className="pointer-events-auto">
                <DynamicIsland>
                    {state.size === "compact" || viewState === "incoming"
                        ? renderCompact()
                        : renderExpanded()
                    }
                </DynamicIsland>
            </div>
        </div>
    )
}

export function GlobalNotificationIsland() {
    return (
        <DynamicIslandProvider initialSize="compact">
            <IslandContent />
        </DynamicIslandProvider>
    )
}
