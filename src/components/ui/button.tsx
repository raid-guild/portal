import { cn } from 'src/utilities/cn'
import { Slot } from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-sm font-mono text-xs font-bold uppercase tracking-[0.08em] ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        clear: '',
        default: 'h-10 px-4 py-2',
        icon: 'h-10 w-10',
        lg: 'h-11 px-7',
        sm: 'h-9 px-3',
      },
      variant: {
        default:
          'border border-moloch-500 bg-moloch-500 text-scroll-100 hover:border-moloch-700 hover:bg-moloch-700 hover:text-scroll-100',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        ghost: 'hover:bg-card hover:text-foreground',
        link: 'items-start justify-start text-moloch-500 underline-offset-4 hover:text-moloch-700 hover:underline',
        outline:
          'border border-border bg-transparent text-foreground hover:border-primary hover:text-primary',
        secondary:
          'border border-border bg-secondary text-secondary-foreground hover:bg-scroll-300/70',
      },
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, className, size, variant, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ className, size, variant }))} ref={ref} {...props} />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
