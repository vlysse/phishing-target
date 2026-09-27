interface TabsProps<T extends string> {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function Tabs<T extends string>({ tabs, value, onChange }: TabsProps<T>) {
  return (
    <div className="flex gap-8 border-b border-[var(--color-border)]">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`relative -mb-px pb-3 text-sm font-medium transition-colors ${
            value === tab.value
              ? "text-[var(--color-brand)]"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          {tab.label}
          {value === tab.value && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[var(--color-brand)]" />
          )}
        </button>
      ))}
    </div>
  );
}
