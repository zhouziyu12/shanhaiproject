import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-purple-600 text-white hover:bg-purple-700": variant === "default",
            "bg-white/10 text-white hover:bg-white/20": variant === "secondary",
            "border border-white/30 text-white hover:bg-white/10": variant === "outline",
            "text-white hover:bg-white/10": variant === "ghost",
          },
          {
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4 py-2": size === "md", 
            "h-12 px-8 text-lg": size === "lg",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
