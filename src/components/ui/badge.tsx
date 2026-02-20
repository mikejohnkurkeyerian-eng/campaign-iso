import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
    {
        variants: {
            variant: {
                default: "border-white/10 bg-surface-overlay text-white",
                success: "border-green-500/20 bg-green-500/10 text-green-400",
                warning: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
                destructive: "border-red-500/20 bg-red-500/10 text-red-400",
                aurora: "border-aurora-blue/20 bg-aurora-blue/10 text-aurora-blue",
                outline: "border-white/20 text-slate-300",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
