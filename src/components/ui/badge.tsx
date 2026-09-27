import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "border-border/60 bg-secondary/80 text-secondary-foreground hover:bg-secondary",
        destructive:
          "border-destructive/30 bg-destructive/10 text-destructive",
        outline: "text-foreground border-border/70",
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-medium",
        warning:
          "border-amber-500/30 bg-amber-500/10 text-amber-400 font-medium",
        info:
          "border-sky-500/30 bg-sky-500/10 text-sky-400 font-medium",
        ai:
          "border-violet-500/30 bg-violet-500/10 text-violet-400 font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
