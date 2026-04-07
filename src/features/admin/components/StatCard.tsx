import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  iconBgColor: string;
  title: string;
  value: string | number;
  badge?: string;
  badgeColor?: string;
}

export function StatCard({ icon, iconBgColor, title, value, badge, badgeColor }: StatCardProps) {
  return (
    <div
      className="p-8 rounded-3xl shadow-sm flex flex-col justify-between transition-colors hover:opacity-95"
      style={{ backgroundColor: "var(--color-surface-container-lowest)" }}
    >
      <div>
        <div className="flex justify-between items-start">
          <div className="p-3 rounded-2xl" style={{ backgroundColor: iconBgColor }}>
            {icon}
          </div>
          {badge && (
            <span className="text-xs font-bold" style={{ color: badgeColor }}>
              {badge}
            </span>
          )}
        </div>
        <h3
          className="text-sm font-bold mt-4"
          style={{ color: "var(--color-on-surface-variant)" }}
        >
          {title}
        </h3>
      </div>
      <p
        className="text-4xl font-black mt-2"
        style={{ color: "var(--color-on-surface)" }}
      >
        {value}
      </p>
    </div>
  );
}
