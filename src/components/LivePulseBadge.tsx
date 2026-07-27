import React from "react";
import { cn } from "@/lib/utils";

interface LivePulseBadgeProps {
  label: string;
  status?: "online" | "warning" | "error" | "info";
  className?: string;
}

export const LivePulseBadge: React.FC<LivePulseBadgeProps> = ({
  label,
  status = "online",
  className = "",
}) => {
  const statusColors = {
    online: "bg-emerald-500 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500 text-amber-700 dark:text-amber-400 border-amber-500/30",
    error: "bg-rose-500 text-rose-700 dark:text-rose-400 border-rose-500/30",
    info: "bg-blue-500 text-blue-700 dark:text-blue-400 border-blue-500/30",
  };

  const dotColors = {
    online: "bg-emerald-500",
    warning: "bg-amber-500",
    error: "bg-rose-500",
    info: "bg-blue-500",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-full border bg-opacity-10 dark:bg-opacity-20 text-xs font-bold tracking-tight shadow-sm backdrop-blur-md transition-all",
        statusColors[status],
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
            dotColors[status]
          )}
        />
        <span
          className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            dotColors[status]
          )}
        />
      </span>
      <span>{label}</span>
    </div>
  );
};
