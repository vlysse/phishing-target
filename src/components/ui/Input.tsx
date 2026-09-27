import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className = "", ...props },
  ref,
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-[15px] text-[var(--color-text-primary)]">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`h-[50px] rounded-[15px] border border-[var(--color-border-strong)] bg-[var(--color-card)] px-5 text-[15px] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-brand)] ${error ? "border-[var(--color-critical)]" : ""} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-[var(--color-critical)]">{error}</span>}
    </div>
  );
});
