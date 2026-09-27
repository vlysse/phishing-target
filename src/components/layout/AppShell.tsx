import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface)]">
      <div className="sticky top-0 h-screen">
        <Sidebar />
      </div>
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <div className="shrink-0">
          <TopBar title={title} />
        </div>
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
