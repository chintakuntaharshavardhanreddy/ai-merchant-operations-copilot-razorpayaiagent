import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "error" | "ai" | "neutral" | "info";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  children,
  variant = "neutral",
  size = "sm",
  dot = false,
  className = "",
  ...props
}: BadgeProps) {
  const variantStyles = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    error: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    ai: "bg-blue-500/10 text-blue-400 border-blue-500/25 shadow-sm shadow-blue-500/10",
    neutral: "bg-zinc-800/60 text-zinc-400 border-zinc-700/50",
    info: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  };

  const dotColors = {
    success: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
    warning: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]",
    error: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]",
    ai: "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]",
    neutral: "bg-zinc-400",
    info: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]",
  };

  const sizeStyles = {
    sm: "text-xs px-2.5 py-0.5 gap-1.5",
    md: "text-xs px-3 py-1 gap-2",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${dotColors[variant]} animate-pulse`}
        />
      )}
      {children}
    </span>
  );
}
