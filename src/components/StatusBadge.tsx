import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type InvoiceStatus = "draft" | "sent" | "viewed" | "paid" | "overdue" | "pending";

interface StatusBadgeProps {
  status: any;
  className?: string;
}

const statusConfig = {
  draft: {
    label: "Draft",
    className: "bg-status-draft/10 text-status-draft border-status-draft/20",
  },
  sent: {
    label: "Sent",
    className: "bg-status-sent/10 text-status-sent border-status-sent/20",
  },
  viewed: {
    label: "Viewed", 
    className: "bg-status-viewed/10 text-status-viewed border-status-viewed/20",
  },
  paid: {
    label: "Paid",
    className: "bg-status-paid/10 text-status-paid border-status-paid/20",
  },
  overdue: {
    label: "Overdue",
    className: "bg-status-overdue/10 text-status-overdue border-status-overdue/20",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = (status || 'draft').toLowerCase() as InvoiceStatus;
  const config = statusConfig[normalizedStatus] || {
    label: typeof status === 'string' ? status.toUpperCase() : "DRAFT",
    className: "bg-slate-100 text-slate-650 border-slate-200"
  };
  
  return (
    <Badge 
      variant="outline" 
      className={cn(config.className, "font-medium", className)}
    >
      {config.label}
    </Badge>
  );
}
