import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  entityName?: string;
  isLoading?: boolean;
  className?: string;
  showQuickJump?: boolean;
}

export const DataTablePagination: React.FC<DataTablePaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  entityName = "records",
  isLoading = false,
  className,
  showQuickJump = true,
}) => {
  const [jumpPage, setJumpPage] = useState("");

  if (totalCount === 0) return null;

  const start = Math.min((currentPage - 1) * pageSize + 1, totalCount);
  const end = Math.min(currentPage * pageSize, totalCount);
  const safeTotalPages = Math.max(1, totalPages);

  // Generate page numbers with ellipsis windowing
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (safeTotalPages <= 7) {
      for (let i = 1; i <= safeTotalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(safeTotalPages - 1, currentPage + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      
      if (currentPage < safeTotalPages - 2) pages.push("...");
      if (!pages.includes(safeTotalPages)) pages.push(safeTotalPages);
    }
    return pages;
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPage, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= safeTotalPages) {
      onPageChange(pageNum);
      setJumpPage("");
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-2.5 px-3.5 py-2 sm:py-2.5",
        "bg-card/70 dark:bg-slate-900/60 backdrop-blur-sm",
        "border border-border/60 dark:border-slate-800/80 rounded-xl mt-3",
        className
      )}
    >
      {/* Left: Range and Total Records Indicator */}
      <div className="flex items-center gap-3 text-xs flex-wrap justify-center sm:justify-start w-full sm:w-auto text-muted-foreground">
        <span className="font-medium">
          Show <strong className="font-semibold text-foreground">{start}–{end}</strong> of{" "}
          <strong className="font-semibold text-foreground">{totalCount}</strong> {entityName}
        </span>

        {/* Rows per page selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-border/60">
            <span className="text-[11px] font-medium text-muted-foreground">
              Rows:
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                onPageSizeChange(Number(val));
                onPageChange(1);
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="h-7 w-[64px] text-xs font-medium rounded-lg border border-border/50 bg-background hover:bg-muted/50 focus:ring-1 focus:ring-primary px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/60 shadow-lg">
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)} className="text-xs font-medium rounded-lg cursor-pointer">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Right: Controls (Page Numbers + Quick Jump) */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-end w-full sm:w-auto">
        {/* Quick Page Jump (visible when more than 5 pages) */}
        {showQuickJump && safeTotalPages > 5 && (
          <form onSubmit={handleJumpSubmit} className="hidden sm:flex items-center gap-1 mr-1">
            <span className="text-[11px] text-muted-foreground font-medium">Go to</span>
            <Input
              type="number"
              min={1}
              max={safeTotalPages}
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              placeholder="#"
              className="h-7.5 w-11 text-center text-xs font-medium rounded-lg border-border/60 bg-background p-1 focus-visible:ring-1 focus-visible:ring-primary"
            />
            {jumpPage && (
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="h-7.5 w-7.5 rounded-lg hover:bg-primary/10 text-primary"
                title="Jump to page"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </form>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          {/* First Page */}
          <Button
            variant="outline"
            size="icon"
            className="h-7.5 w-7.5 rounded-lg border-border/60 bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1 || isLoading}
            title="First Page"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>

          {/* Previous Page */}
          <Button
            variant="outline"
            size="sm"
            className="h-7.5 px-2.5 rounded-lg border-border/60 bg-background hover:bg-muted text-xs font-medium text-foreground gap-1 transition-all active:scale-95"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1 || isLoading}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </Button>

          {/* Numeric Page Buttons */}
          <div className="hidden sm:flex items-center gap-1 mx-0.5">
            {getPageNumbers().map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`ellipsis-${idx}`} className="px-1 text-xs font-semibold text-muted-foreground">
                    •••
                  </span>
                );
              }
              const isCurrent = p === currentPage;
              return (
                <Button
                  key={`page-${p}`}
                  variant={isCurrent ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-7.5 min-w-[30px] px-2 text-xs font-semibold rounded-lg transition-all",
                    isCurrent
                      ? "bg-primary text-primary-foreground border-primary shadow-sm pointer-events-none"
                      : "border-border/60 bg-background hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95"
                  )}
                  onClick={() => onPageChange(Number(p))}
                  disabled={isLoading}
                >
                  {p}
                </Button>
              );
            })}
          </div>

          {/* Mobile Current Page Indicator */}
          <div className="sm:hidden px-2 py-0.5 rounded-lg bg-muted text-xs font-semibold text-foreground border border-border/60">
            {currentPage} / {safeTotalPages}
          </div>

          {/* Next Page */}
          <Button
            variant="outline"
            size="sm"
            className="h-7.5 px-2.5 rounded-lg border-border/60 bg-background hover:bg-muted text-xs font-medium text-foreground gap-1 transition-all active:scale-95"
            onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
            disabled={currentPage >= safeTotalPages || isLoading}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>

          {/* Last Page */}
          <Button
            variant="outline"
            size="icon"
            className="h-7.5 w-7.5 rounded-lg border-border/60 bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95"
            onClick={() => onPageChange(safeTotalPages)}
            disabled={currentPage >= safeTotalPages || isLoading}
            title="Last Page"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
