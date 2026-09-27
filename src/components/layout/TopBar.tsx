import { useAuth } from "../../lib/auth-context";
import { BellIcon, GearIcon, SearchIcon } from "../ui/icons";

export function TopBar({ title }: { title: string }) {
  const { user } = useAuth();
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  return (
    <header className="flex h-[100px] items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-card)] px-8">
      <h1 className="text-[28px] font-semibold text-[var(--color-text-primary)]">{title}</h1>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2.5 rounded-full bg-[var(--color-surface)] px-5 py-3 sm:flex">
          <SearchIcon className="h-5 w-5 text-[var(--color-text-muted)]" />
          <span className="text-sm text-[var(--color-text-muted)]">Search for something</span>
        </div>

        <button
          aria-label="Settings"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)]"
        >
          <GearIcon className="h-5 w-5" />
        </button>
        <button
          aria-label="Notifications"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-critical)]/10 text-[var(--color-critical)] transition-colors hover:bg-[var(--color-critical)]/20"
        >
          <BellIcon className="h-5 w-5" />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-brand)]/15 text-sm font-semibold text-[var(--color-brand)]">
          {initials}
        </div>
      </div>
    </header>
  );
}
