import React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none";

  const variantStyles = {
    primary:
      "bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-600/20 active:bg-blue-700",
    secondary:
      "bg-[#151922] hover:bg-[#1C2230] text-zinc-200 border border-[#262F40] active:bg-[#12161F]",
    outline:
      "border border-zinc-700/70 hover:border-zinc-500 bg-transparent text-zinc-300 hover:text-white active:bg-zinc-800/40",
    ghost:
      "bg-transparent hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 active:bg-zinc-800",
    danger:
      "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 active:bg-rose-500/30",
    success:
      "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 active:bg-emerald-500/30",
  };

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-xs px-4 py-2 gap-2",
    lg: "text-sm px-5 py-2.5 gap-2.5 font-medium",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
