import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@/components/ui/table';
import {
  Eye,
  History,
  CheckCircle2,
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { KitchenOrder } from '@/services/kitchenService';

interface OrderHistoryListProps {
  completedOrders: KitchenOrder[];
  onViewDetails: (order: KitchenOrder) => void;
  onDeleteOrder: (orderId: string) => void;
}

export const OrderHistoryList: React.FC<OrderHistoryListProps> = ({
  completedOrders,
  onViewDetails,
  onDeleteOrder
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'dine_in' | 'takeaway'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | '1hr'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Delete Confirmation State (1-Step)
  const [orderToDelete, setOrderToDelete] = useState<KitchenOrder | null>(null);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return completedOrders.filter(order => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesToken = order.tokenNumber.toLowerCase().includes(q);
        const matchesInvoice = order.orderNumber.toLowerCase().includes(q);
        const matchesTable = (order.tableName || '').toLowerCase().includes(q);
        const matchesCustomer = (order.customerName || '').toLowerCase().includes(q);
        const matchesItems = order.items.some(item => item.name.toLowerCase().includes(q));

        if (!matchesToken && !matchesInvoice && !matchesTable && !matchesCustomer && !matchesItems) {
          return false;
        }
      }

      // 2. Type Filter (Dine-in vs Takeaway)
      if (typeFilter === 'takeaway') {
        const isTakeaway = (order.tableName || '').toLowerCase().includes('takeaway');
        if (!isTakeaway) return false;
      } else if (typeFilter === 'dine_in') {
        const isTakeaway = (order.tableName || '').toLowerCase().includes('takeaway');
        if (isTakeaway) return false;
      }

      // 3. Time Filter
      if (timeFilter !== 'all') {
        const orderTime = new Date(order.completedAt || order.createdAt).getTime();
        const now = Date.now();

        if (timeFilter === '1hr') {
          if (now - orderTime > 60 * 60 * 1000) return false;
        } else if (timeFilter === 'today') {
          const orderDate = new Date(order.completedAt || order.createdAt).toDateString();
          const today = new Date().toDateString();
          if (orderDate !== today) return false;
        }
      }

      return true;
    });
  }, [completedOrders, searchQuery, typeFilter, timeFilter]);

  // Reset page when filter changes
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleTypeChange = (val: string) => {
    setTypeFilter(val as 'all' | 'dine_in' | 'takeaway');
    setCurrentPage(1);
  };

  const handleTimeChange = (val: string) => {
    setTimeFilter(val as 'all' | 'today' | '1hr');
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setTimeFilter('all');
    setCurrentPage(1);
  };

  // Open 1-Step confirmation delete modal
  const promptDeleteOrder = (order: KitchenOrder) => {
    setOrderToDelete(order);
  };

  const handleConfirmDelete = () => {
    if (orderToDelete) {
      onDeleteOrder(orderToDelete.id);
      setOrderToDelete(null);
    }
  };

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + pageSize);

  const isFiltered = searchQuery.trim() !== '' || typeFilter !== 'all' || timeFilter !== 'all';

  return (
    <>
      <Card className="bg-card text-card-foreground border border-border/80 shadow-md rounded-2xl overflow-hidden transition-all">
        {/* Header & Filter Controls */}
        <div className="p-4 sm:p-5 border-b border-border/80 bg-muted/20 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <History className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">
                    Order History &amp; Completed Queue
                  </h3>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30 text-[10px] font-black px-2 py-0.5">
                    {filteredOrders.length} Done
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Past completed kitchen tickets with item breakdown, timestamps &amp; deletion verification
                </p>
              </div>
            </div>

            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8 px-2.5 self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </Button>
            )}
          </div>

          {/* Filter Controls Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
            {/* Search Box */}
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search token, invoice #, table, customer or dish..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl border-border bg-background"
              />
            </div>

            {/* Dine-in vs Takeaway filter */}
            <div className="sm:col-span-3">
              <Select value={typeFilter} onValueChange={handleTypeChange}>
                <SelectTrigger className="h-9 text-xs rounded-xl border-border bg-background">
                  <SelectValue placeholder="All Order Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Order Types</SelectItem>
                  <SelectItem value="dine_in">Dine-In Tables</SelectItem>
                  <SelectItem value="takeaway">Takeaway Orders</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time range filter */}
            <div className="sm:col-span-3">
              <Select value={timeFilter} onValueChange={handleTimeChange}>
                <SelectTrigger className="h-9 text-xs rounded-xl border-border bg-background">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Completed Today</SelectItem>
                  <SelectItem value="1hr">Last 1 Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Orders List / Table */}
        {paginatedOrders.length === 0 ? (
          <div className="py-12 text-center space-y-2 p-4">
            <History className="w-8 h-8 text-muted-foreground/50 mx-auto" />
            <p className="text-sm font-semibold text-foreground">
              {isFiltered ? "No matching completed orders" : "No completed orders yet"}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {isFiltered
                ? "Try clearing your search query or filter criteria to see past orders."
                : "Active tickets marked 'Order Complete' in the kitchen queue will appear here."}
            </p>
            {isFiltered && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="mt-2 text-xs font-bold rounded-xl"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="w-[90px] text-xs font-bold uppercase tracking-wider text-muted-foreground">Token #</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Table / Type</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Invoice &amp; Guest</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Items Prepared</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Completed Time</TableHead>
                    <TableHead className="w-[100px] text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((order) => {
                    const completedTime = order.completedAt
                      ? new Date(order.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    const completedDate = order.completedAt
                      ? new Date(order.completedAt).toLocaleDateString([], { day: '2-digit', month: 'short' })
                      : new Date(order.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short' });

                    const isTakeaway = (order.tableName || '').toLowerCase().includes('takeaway');
                    const totalItemsCount = order.items.reduce((s, i) => s + i.quantity, 0);

                    return (
                      <TableRow key={order.id} className="border-border hover:bg-muted/30 transition-colors">
                        <TableCell className="font-mono">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 font-black text-sm border border-amber-500/30">
                            #{order.tokenNumber}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              isTakeaway
                                ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 text-xs font-bold"
                                : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 text-xs font-bold"
                            }
                          >
                            {order.tableName || 'Dine-In'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-foreground truncate max-w-[150px]">
                              {order.customerName || 'Walk-in Guest'}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {order.orderNumber}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[240px]">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-foreground truncate" title={order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}>
                              {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} total
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-foreground">
                              ₹{order.totalAmount}
                            </span>
                            {order.paymentMode && (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {order.paymentMode}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>{completedTime}</span>
                            <span className="text-muted-foreground text-[10px]">({completedDate})</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onViewDetails(order)}
                              title="View order details"
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => promptDeleteOrder(order)}
                              title="Delete order ticket"
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden divide-y divide-border">
              {paginatedOrders.map((order) => {
                const completedTime = order.completedAt
                  ? new Date(order.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={order.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-muted/20">
                    <div className="flex items-start gap-3">
                      <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-black text-sm border border-amber-500/30">
                        #{order.tokenNumber}
                      </span>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-foreground">{order.tableName || 'Dine-In'}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">({order.orderNumber})</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-0.5">
                          <span className="font-bold text-foreground">₹{order.totalAmount}</span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 font-medium">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {completedTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewDetails(order)}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => promptDeleteOrder(order)}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="p-3 sm:p-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/10">
              <div className="text-xs text-muted-foreground">
                Showing <span className="font-bold text-foreground">{startIndex + 1}</span> to{' '}
                <span className="font-bold text-foreground">
                  {Math.min(startIndex + pageSize, filteredOrders.length)}
                </span>{' '}
                of <span className="font-bold text-foreground">{filteredOrders.length}</span> completed orders
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="h-8 px-2.5 rounded-lg text-xs font-bold gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Prev</span>
                </Button>

                <div className="text-xs font-bold px-2.5 py-1 rounded-md bg-muted text-foreground">
                  {safeCurrentPage} / {totalPages}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="h-8 px-2.5 rounded-lg text-xs font-bold gap-1"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* 1-STEP CONFIRMATION DELETE MODAL */}
      <Dialog
        open={!!orderToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setOrderToDelete(null);
          }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl p-6 bg-background">
          <DialogHeader className="pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <DialogTitle className="text-base font-bold text-foreground">
                Delete Order Ticket
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete this order ticket from kitchen history?
            </DialogDescription>
          </DialogHeader>

          {orderToDelete && (
            <div className="space-y-4 py-2">
              {/* Order Summary Snapshot */}
              <div className="p-3.5 bg-muted/40 border border-border/80 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                      #{orderToDelete.tokenNumber}
                    </span>
                    <Badge variant="outline" className="font-bold text-xs">
                      {orderToDelete.tableName || 'Dine-In'}
                    </Badge>
                  </div>
                  <span className="font-mono text-xs font-bold text-foreground">
                    ₹{orderToDelete.totalAmount}
                  </span>
                </div>

                <div className="text-muted-foreground flex items-center justify-between">
                  <span>Invoice: <strong className="text-foreground">{orderToDelete.orderNumber}</strong></span>
                  <span>Customer: <strong className="text-foreground">{orderToDelete.customerName || 'Walk-in'}</strong></span>
                </div>

                <div className="text-[11px] text-muted-foreground/90 pt-1.5 border-t border-border/50 truncate">
                  {orderToDelete.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                </div>
              </div>

              {/* Warning Alert */}
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-rose-800 dark:text-rose-300">
                    Permanent Removal Warning
                  </p>
                  <p className="text-rose-700/90 dark:text-rose-300/80 leading-relaxed">
                    Token <strong>#{orderToDelete.tokenNumber}</strong> will be permanently removed from completed kitchen history. This action cannot be undone.
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOrderToDelete(null)}
                  className="rounded-xl h-9 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-9 text-xs font-bold gap-1.5 shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Permanently Delete</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
