import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "rounded-[12px] bg-[var(--color-brand-strong)] text-white hover:opacity-90",
  secondary:
    "rounded-full border border-[var(--color-border-strong)] bg-[var(--color-card)] text-[var(--color-brand)] hover:border-[var(--color-brand)]",
  ghost: "rounded-full bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]",
  danger: "rounded-[12px] bg-[var(--color-critical)] text-white hover:opacity-90",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-12 px-6 text-[15px]",
};

export function Button({ variant = "primary", size = "md", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
