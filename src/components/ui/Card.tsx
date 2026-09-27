import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[25px] border border-[var(--color-border-strong)] bg-[var(--color-card)] p-6 ${className}`}
      {...props}
    />
  );
}
