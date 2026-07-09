import { isValidElement } from "react";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: string;
  trend?: number | { value: string; positive: boolean };
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode | React.ComponentType<{ className?: string }>;
  className?: string;
}

export function StatCard({ title, value, subtitle, trend, change, changeType = "neutral", icon, className }: StatCardProps) {
  const isTrendObject = trend && typeof trend === 'object';
  const isPositive = isTrendObject ? (trend as any).positive : (trend && (trend as number) > 0);
  const isNegative = isTrendObject ? !(trend as any).positive : (trend && (trend as number) < 0);
  const trendValue = isTrendObject ? (trend as any).value : (trend !== undefined ? `${Math.abs(trend as number).toFixed(1)}%` : '');

  const iconNode = isValidElement(icon) ? (
    icon
  ) : icon ? (
    (() => {
      const IconComponent = icon as React.ComponentType<{ className?: string }>;
      return <IconComponent className="w-5 h-5" />;
    })()
  ) : null;

  return (
    <Card className={cn("p-4 sm:p-5 lg:p-6 bg-card dark:bg-card border-2 rounded-2xl flex flex-col justify-center", className)}>
      <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60 mb-2 leading-tight">{title}</p>
      
      <div className="flex items-center justify-between gap-2">
        <p className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight pr-1 break-words leading-none">{value}</p>
        <div className={cn(
          "p-2 rounded-lg opacity-40 shrink-0",
          changeType === "positive" && "bg-emerald-500/10 text-emerald-600",
          changeType === "negative" && "bg-rose-500/10 text-rose-600",
          changeType === "neutral" && "bg-blue-500/10 text-blue-600"
        )}>
          {iconNode}
        </div>
      </div>
      
      <div className="flex items-center gap-2 mt-2">
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
            isPositive ? "bg-emerald-500/10 text-emerald-600" : 
            isNegative ? "bg-rose-500/10 text-rose-600" : 
            "bg-slate-500/10 text-slate-600 dark:text-slate-400"
          )}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : 
             isNegative ? <ArrowDownRight className="w-3 h-3" /> : 
             <Minus className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
        {change && (
          <p className={cn(
            "text-[9.5px] sm:text-[10px] font-bold leading-tight mt-1 sm:mt-0 break-words",
            changeType === "positive" && "text-emerald-600/60",
            changeType === "negative" && "text-rose-600/60",
            changeType === "neutral" && "text-blue-600/60"
          )}>
            {change}
          </p>
        )}
        {subtitle && (
          <p className="text-[10px] sm:text-[11px] font-bold leading-tight mt-1 sm:mt-0 break-words text-muted-foreground opacity-60">
            {subtitle}
          </p>
        )}
      </div>
    </Card>
  );
}
