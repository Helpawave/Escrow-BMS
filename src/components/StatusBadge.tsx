import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type InvoiceStatus = "draft" | "sent" | "viewed" | "paid" | "overdue" | "pending" | "partial";

interface StatusBadgeProps {
  status?: InvoiceStatus | string;
  dueDate?: string | null;
  notes?: string | null;
  className?: string;
}

/**
 * Determines the effective status of an invoice.
 * If status is not 'paid' and due_date has passed, it is considered 'overdue'.
 */
export function getInvoiceEffectiveStatus(status?: string | null, dueDate?: string | null, notes?: string | null): InvoiceStatus {
  const norm = (status || "draft").toLowerCase().trim();
  if (norm === "paid") return "paid";
  if (norm === "partial") return "partial";

  // Check if invoice has partial payment or pending finance metadata in notes
  if (notes && typeof notes === 'string') {
    if (notes.includes('"type":"partial"') || notes.includes('"disbursed":false') || notes.includes('is_partial')) {
      return "partial";
    }
  }

  if (norm === "overdue") return "overdue";

  if (dueDate && norm !== "paid") {
    const d = new Date(dueDate);
    if (!isNaN(d.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      d.setHours(0, 0, 0, 0);
      if (d < today) {
        return "overdue";
      }
    }
  }

  const validStatuses: InvoiceStatus[] = ["draft", "sent", "viewed", "paid", "overdue", "pending", "partial"];
  return validStatuses.includes(norm as InvoiceStatus) ? (norm as InvoiceStatus) : "draft";
}

const statusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
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
  partial: {
    label: "Partial",
    className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 font-bold",
  },
  overdue: {
    label: "Overdue",
    className: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
};

export function StatusBadge({ status, dueDate, notes, className }: StatusBadgeProps) {
  const effectiveStatus = getInvoiceEffectiveStatus(status, dueDate, notes);
  const config = statusConfig[effectiveStatus] || statusConfig.draft;
  
  return (
    <Badge 
      variant="outline" 
      className={cn(config.className, "font-medium capitalize inline-flex items-center gap-1.5", className)}
    >
      {effectiveStatus === "overdue" && (
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
      )}
      {config.label}
    </Badge>
  );
}
