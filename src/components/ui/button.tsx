import { cn } from 'src/utilities/cn'
import { Slot } from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-sans text-base font-bold leading-none ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        clear: '',
        default: 'h-11 px-6 py-2.5',
        icon: 'h-10 w-10',
        lg: 'h-12 px-8',
        sm: 'h-9 px-4 text-sm',
      },
      variant: {
        default:
          'border border-primary bg-primary text-primary-foreground hover:border-primary/90 hover:bg-[hsl(var(--primary-hover))]',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        ghost: 'hover:bg-card hover:text-foreground',
        link: 'items-start justify-start text-primary underline-offset-4 hover:text-[hsl(var(--primary-hover))] hover:underline',
        outline:
          'border border-border bg-transparent text-foreground hover:border-primary hover:text-primary',
        secondary:
          'border border-border bg-secondary text-secondary-foreground hover:bg-[hsl(var(--secondary-hover))]',
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
