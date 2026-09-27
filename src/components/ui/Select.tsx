import { useEffect, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function Select({ value, onChange, options, label, placeholder = "Select..." }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[15px] text-[var(--color-text-primary)]">{label}</label>}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-[50px] w-full items-center justify-between rounded-[15px] border border-[var(--color-border-strong)] bg-[var(--color-card)] px-5 text-[15px] text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-brand)]"
        >
          <span className={selected ? "" : "text-[var(--color-text-secondary)]"}>
            {selected ? selected.label : placeholder}
          </span>
          <span className="text-[var(--color-text-secondary)]">
            <ChevronIcon open={open} />
          </span>
        </button>

        {open && (
          <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-[15px] border border-[var(--color-border-strong)] bg-[var(--color-card)] p-1.5 shadow-[0_10px_40px_-8px_rgba(52,60,106,0.18)]">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center rounded-[10px] px-4 py-2.5 text-left text-[15px] transition-colors ${
                  o.value === value
                    ? "bg-[var(--color-brand)]/10 text-[var(--color-brand)]"
                    : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
