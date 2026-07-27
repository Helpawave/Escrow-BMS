import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  FileText,
  PlusCircle,
  Building2,
  Package,
  Calculator,
  LayoutDashboard,
  Settings,
  CreditCard,
  Scan,
  TrendingUp,
  Receipt,
  Sparkles,
} from "lucide-react";

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command, module, or search action... (e.g. /invoice, /ledger)" />
      <CommandList className="max-h-[380px] p-2">
        <CommandEmpty>
          <div className="py-6 text-center text-sm text-slate-500">
            No matching command or module found.
          </div>
        </CommandEmpty>

        {/* Core ERP Quick Actions */}
        <CommandGroup heading="⚡ Fast Quick Actions">
          <CommandItem
            onSelect={() => runCommand(() => navigate("/billing/create-invoice"))}
            className="flex items-center gap-2 cursor-pointer font-medium"
          >
            <PlusCircle className="h-4 w-4 text-emerald-500" />
            <span>Create Sales Invoice</span>
            <CommandShortcut className="text-xs bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded font-mono">
              Ctrl+N
            </CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate("/payroll/payroll"))}
            className="flex items-center gap-2 cursor-pointer font-medium"
          >
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span>Run Monthly Payroll & Payout</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate("/ledger/transfer-entry"))}
            className="flex items-center gap-2 cursor-pointer font-medium"
          >
            <Receipt className="h-4 w-4 text-indigo-500" />
            <span>Post Journal / Transfer Entry</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate("/inventory/scan"))}
            className="flex items-center gap-2 cursor-pointer font-medium"
          >
            <Scan className="h-4 w-4 text-amber-500" />
            <span>Scan Product Barcode HUD</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="my-1" />

        {/* Modules & Sub-systems */}
        <CommandGroup heading="🏢 Modules & Workspace Views">
          <CommandItem
            onSelect={() => runCommand(() => navigate("/dashboard"))}
            className="flex items-center gap-2 cursor-pointer"
          >
            <LayoutDashboard className="h-4 w-4 text-slate-500" />
            <span>Executive Dashboard</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate("/billing"))}
            className="flex items-center gap-2 cursor-pointer"
          >
            <FileText className="h-4 w-4 text-emerald-500" />
            <span>Billing & Invoices Suite</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate("/ledger"))}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Building2 className="h-4 w-4 text-blue-500" />
            <span>Account Ledger & Reports</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate("/payroll"))}
            className="flex items-center gap-2 cursor-pointer"
          >
            <CreditCard className="h-4 w-4 text-purple-500" />
            <span>Payroll & Escrow Vault</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate("/inventory"))}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Package className="h-4 w-4 text-amber-500" />
            <span>Inventory & Stock Management</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate("/calculation"))}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Calculator className="h-4 w-4 text-teal-500" />
            <span>Daily Hisab Cashbook</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate("/crm"))}
            className="flex items-center gap-2 cursor-pointer"
          >
            <TrendingUp className="h-4 w-4 text-rose-500" />
            <span>CRM Deals & Lead Pipeline</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate("/settings"))}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Settings className="h-4 w-4 text-slate-500" />
            <span>Settings & Business Profile</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
