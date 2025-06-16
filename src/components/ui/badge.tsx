import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "error";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
          {
            "bg-purple-600 text-white": variant === "default",
            "bg-white/10 text-white": variant === "secondary", 
            "bg-green-600 text-white": variant === "success",
            "bg-yellow-600 text-white": variant === "warning",
            "bg-red-600 text-white": variant === "error",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
