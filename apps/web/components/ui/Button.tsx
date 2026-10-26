import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-sans font-medium text-xs md:text-sm tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal-orange disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-signal-orange text-white hover:bg-[#d65f2f] active:bg-[#c25427] border border-transparent shadow-none rounded-[3px]",
        secondary:
          "bg-white text-ink border border-border hover:bg-neutral-50 active:bg-neutral-100 rounded-[3px]",
        destructive:
          "bg-status-error text-white hover:bg-[#a5332b] active:bg-[#912d26] border border-transparent rounded-[3px]",
        outline:
          "bg-transparent text-ink border border-border hover:bg-neutral-50 rounded-[3px]",
        ghost:
          "bg-transparent text-ink hover:bg-neutral-100 rounded-[3px]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-9 px-4 py-2",
        lg: "h-11 px-6 text-sm",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
