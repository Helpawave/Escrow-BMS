import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Eye } from "lucide-react";
import { format } from "date-fns";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Client, EInvoiceHistoryItem, EWayBillHistoryItem } from '../types';

interface HistoryTabProps {
  historyTab: string;
  onHistoryTabChange: (tab: string) => void;
  historyLoading: boolean;
  eInvoiceHistory: EInvoiceHistoryItem[];
  eWayBillHistory: EWayBillHistoryItem[];
  clients: Client[];
  currencySymbol: string;
  onViewItem: (item: EInvoiceHistoryItem | EWayBillHistoryItem, type: 'einvoice' | 'ewaybill') => void;
  onDownloadPDF: (type: 'einvoice' | 'ewaybill', item: EInvoiceHistoryItem | EWayBillHistoryItem) => void;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  historyTab,
  onHistoryTabChange,
  historyLoading,
  eInvoiceHistory,
  eWayBillHistory,
  clients,
  currencySymbol,
  onViewItem,
  onDownloadPDF,
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  return (
    <TabsContent value="history" className="space-y-6">
      <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Document History</CardTitle>
        <p className="text-sm text-muted-foreground">Review previously generated documents</p>
      </CardHeader>
      <CardContent>
        <Tabs value={historyTab} onValueChange={onHistoryTabChange}>
          <TabsList className="bg-transparent h-auto p-0 flex space-x-2 border-b rounded-none mb-6">
            <TabsTrigger
              value="einvoice-history"
              className="px-6 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              E-Invoice History
            </TabsTrigger>
            <TabsTrigger
              value="ewaybill-history"
              className="px-6 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              E-Way Bill History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="einvoice-history">
            {historyLoading ? (
              <div className="flex items-center justify-center p-4 md:p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : eInvoiceHistory.length === 0 ? (
              <div className="text-center p-4 md:p-8 text-muted-foreground">
                No E-Invoices found
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Invoice Number</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Client</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Date</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Amount</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Status</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eInvoiceHistory.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{clients.find(c => c.id === invoice.client_id)?.name || 'N/A'}</TableCell>
                        <TableCell>{format(new Date(invoice.invoice_date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{currencySymbol}{invoice.total_amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={invoice.status === 'generated' ? 'default' : 'secondary'}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onViewItem(invoice, 'einvoice')}
                              className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDownloadPDF('einvoice', invoice)}
                              className="h-8 bg-background hover:bg-muted font-bold text-[10px] uppercase tracking-widest border-2 px-3"
                            >
                              <Download className="h-3.5 w-3.5 mr-1" />
                              PDF
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination Controls */}
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  pageSize={pageSize}
                  onPageChange={onPageChange}
                  onPageSizeChange={onPageSizeChange}
                  entityName="e-invoices"
                  isLoading={historyLoading}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="ewaybill-history">
            {historyLoading ? (
              <div className="flex items-center justify-center p-4 md:p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : eWayBillHistory.length === 0 ? (
              <div className="text-center p-4 md:p-8 text-muted-foreground">
                No E-Way Bills found
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Document Number</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Client</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Date</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Value</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Transport Mode</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Status</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eWayBillHistory.map((ewaybill) => (
                      <TableRow key={ewaybill.id}>
                        <TableCell className="font-medium">{ewaybill.document_number}</TableCell>
                        <TableCell>{clients.find(c => c.id === ewaybill.client_id)?.name || 'N/A'}</TableCell>
                        <TableCell>{format(new Date(ewaybill.document_date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{currencySymbol}{ewaybill.total_value.toFixed(2)}</TableCell>
                        <TableCell>{ewaybill.transport_mode}</TableCell>
                        <TableCell>
                          <Badge variant={ewaybill.status === 'generated' ? 'default' : 'secondary'}>
                            {ewaybill.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onViewItem(ewaybill, 'ewaybill')}
                              className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDownloadPDF('ewaybill', ewaybill)}
                              className="h-8 bg-background hover:bg-muted font-bold text-[10px] uppercase tracking-widest border-2 px-3"
                            >
                              <Download className="h-3.5 w-3.5 mr-1" />
                              PDF
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination Controls */}
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  pageSize={pageSize}
                  onPageChange={onPageChange}
                  onPageSizeChange={onPageSizeChange}
                  entityName="e-way bills"
                  isLoading={historyLoading}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </TabsContent>
  );
};
