import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            "flex h-9 w-full border border-border bg-white px-3 py-1.5 text-xs md:text-sm text-ink placeholder:text-muted transition-colors rounded-[3px]",
            "focus-visible:outline-none focus-visible:border-signal-orange focus-visible:ring-1 focus-visible:ring-signal-orange",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-status-error focus-visible:border-status-error focus-visible:ring-status-error",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-[11px] font-mono text-status-error">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
