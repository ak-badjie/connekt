"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const DialogContext = React.createContext<{
    open: boolean
    onOpenChange: (open: boolean) => void
}>({
    open: false,
    onOpenChange: () => { },
})

interface DialogProps {
    children: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

const Dialog: React.FC<DialogProps> = ({ children, open = false, onOpenChange = () => { } }) => {
    return (
        <DialogContext.Provider value={{ open, onOpenChange }}>
            {children}
        </DialogContext.Provider>
    )
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
    ({ className, children, ...props }, ref) => {
        const { open, onOpenChange } = React.useContext(DialogContext)
        const [mounted, setMounted] = React.useState(false)

        React.useEffect(() => {
            setMounted(true)
            return () => setMounted(false)
        }, [])

        if (!mounted || !open) return null

        return createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in-0"
                    onClick={() => onOpenChange(false)}
                />

                {/* Content */}
                <div
                    ref={ref}
                    className={cn(
                        "fixed z-[9999] grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 sm:rounded-lg md:w-full",
                        "bg-white dark:bg-zinc-900 dark:border-zinc-800",
                        className
                    )}
                    {...props}
                >
                    {children}
                    <button
                        onClick={() => onOpenChange(false)}
                        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </button>
                </div>
            </div>,
            document.body
        )
    }
)
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col space-y-1.5 text-center sm:text-left",
            className
        )}
        {...props}
    />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
            className
        )}
        {...props}
    />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-lg font-semibold leading-none tracking-tight",
            className
        )}
        {...props}
    />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
))
DialogDescription.displayName = "DialogDescription"

export {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
}
