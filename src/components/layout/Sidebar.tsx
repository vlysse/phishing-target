import { NavLink, useNavigate } from "react-router-dom";
import type { ComponentType, SVGProps } from "react";
import { useAuth } from "../../lib/auth-context";
import {
  AccountsIcon,
  HomeIcon,
  LogoutIcon,
  SettingsIcon,
  TransactionsIcon,
  TransferIcon,
} from "../ui/icons";

const NAV_ITEMS: { to: string; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { to: "/", label: "Dashboard", Icon: HomeIcon },
  { to: "/transactions", label: "Transactions", Icon: TransactionsIcon },
  { to: "/accounts", label: "Accounts", Icon: AccountsIcon },
  { to: "/transfer", label: "Transfer", Icon: TransferIcon },
  { to: "/settings", label: "Settings", Icon: SettingsIcon },
];

export function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-card)]">
      <div className="flex h-[100px] items-center gap-2.5 px-8">
        <img src="/logo.png" alt="TDVX Banking" className="h-9 w-9 object-contain" />
        <span className="text-xl font-extrabold text-[var(--color-text-primary)]">TDVX Banking</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 pt-4">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `relative flex items-center gap-4 py-3.5 pl-8 text-[17px] font-medium transition-colors ${
                isActive
                  ? "text-[var(--color-brand)]"
                  : "text-[var(--color-text-inactive)] hover:text-[var(--color-text-secondary)]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-[60px] w-[6px] -translate-y-1/2 rounded-r-[10px] bg-[var(--color-brand)]" />
                )}
                <Icon className="h-6 w-6" />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-4 border-t border-[var(--color-border)] py-4 pl-8 text-[17px] font-medium text-[var(--color-text-inactive)] transition-colors hover:text-[var(--color-critical)]"
      >
        <LogoutIcon className="h-6 w-6" />
        Logout
      </button>
    </aside>
  );
}
