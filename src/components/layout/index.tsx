import React from "react";
import { cn } from "@/lib/utils";

// -------
// Page Header
// -------
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-6", className)}>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && (
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

// -------
// Section
// -------
interface SectionProps {
  children: React.ReactNode;
  className?: string;
}

export function Section({ children, className }: SectionProps) {
  return (
    <section className={cn("w-full", className)}>
      {children}
    </section>
  );
}

// -------
// Container
// -------
interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-full",
};

export function Container({ children, className, maxWidth }: ContainerProps) {
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6", maxWidth && maxWidthClasses[maxWidth], className)}>
      {children}
    </div>
  );
}

// -------
// Grid
// -------
interface GridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  className?: string;
}

const gridCols = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

const gridGaps = {
  sm: "gap-3",
  md: "gap-5",
  lg: "gap-6",
};

export function Grid({ children, cols = 3, gap = "md", className }: GridProps) {
  return (
    <div className={cn("grid", gridCols[cols], gridGaps[gap], className)}>
      {children}
    </div>
  );
}

// -------
// Progress Bar
// -------
interface ProgressBarProps {
  value: number; // 0–100
  label?: string;
  showValue?: boolean;
  className?: string;
  color?: "brand" | "green" | "yellow" | "red";
}

const progressColors = {
  brand: "gradient-brand",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
};

export function ProgressBar({
  value,
  label,
  showValue = false,
  className,
  color = "brand",
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs text-slate-500">{label}</span>}
          {showValue && <span className="text-xs font-medium text-slate-700">{clamped}%</span>}
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", progressColors[color])}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
