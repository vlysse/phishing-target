import type { ComponentType, SVGProps } from "react";
import { Card } from "./Card";

interface StatCardProps {
  label: string;
  value: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  tint: "gold" | "blue" | "pink" | "teal";
}

const TINTS: Record<StatCardProps["tint"], string> = {
  gold: "bg-[#fff5d9] text-[#fcaa0b]",
  blue: "bg-[#e7edff] text-[var(--color-brand)]",
  pink: "bg-[#ffe0eb] text-[#ff4b81]",
  teal: "bg-[#dcfaf8] text-[#16dbcc]",
};

export function StatCard({ label, value, Icon, tint }: StatCardProps) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${TINTS[tint]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
        <span className="text-xl font-semibold tabular-nums text-[var(--color-text-primary)]">{value}</span>
      </div>
    </Card>
  );
}
