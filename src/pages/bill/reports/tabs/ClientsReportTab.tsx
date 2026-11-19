import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTablePagination } from '@/components/DataTablePagination';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Users,
} from 'lucide-react';
import { ClientReportData } from '../types';

export interface ClientsReportTabProps {
  exportClientsExcel: () => void;
  exportClientsPDF: (isPrint?: boolean) => void;
  filteredAndSortedClients: ClientReportData[];
  clientSearchTerm: string;
  setClientSearchTerm: (value: string) => void;
  handleClientSort: (field: string) => void;
  clientSortField: string;
  clientSortDirection: 'asc' | 'desc';
  paginatedClientsList: ClientReportData[];
  currencySymbol: string;
  clientsReportPage: number;
  clientsReportPageSize: number;
  setClientsReportPage: (page: number) => void;
  setClientsReportPageSize: (size: number) => void;
}

export const ClientsReportTab: React.FC<ClientsReportTabProps> = ({
  exportClientsExcel,
  exportClientsPDF,
  filteredAndSortedClients,
  clientSearchTerm,
  setClientSearchTerm,
  handleClientSort,
  clientSortField,
  clientSortDirection,
  paginatedClientsList,
  currencySymbol,
  clientsReportPage,
  clientsReportPageSize,
  setClientsReportPage,
  setClientsReportPageSize,
}) => {
  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <div className="flex flex-wrap justify-end gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={exportClientsExcel}
          className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
        >
          <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
          Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportClientsPDF(false)}
          className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
        >
          <Download className="w-4 h-4 mr-1.5 text-rose-600" />
          PDF
        </Button>
        <Button
          size="sm"
          onClick={() => exportClientsPDF(true)}
          className="font-semibold text-xs rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
        >
          <Printer className="w-4 h-4 mr-1.5" />
          Print
        </Button>
      </div>

      <Card className="p-4 sm:p-6 bg-card dark:bg-card shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Client Performance Report</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{filteredAndSortedClients.length} clients matched</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={clientSearchTerm}
              onChange={(e) => setClientSearchTerm(e.target.value)}
              placeholder="Search client name..."
              className="pl-9 h-10 bg-background"
            />
          </div>
        </div>
        {filteredAndSortedClients && filteredAndSortedClients.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th onClick={() => handleClientSort('name')} className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted transition-colors rounded-tl-lg">
                      <div className="flex items-center gap-1">
                        Client
                        <span className="text-[10px] text-primary">
                          {clientSortField === 'name' ? (clientSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                        </span>
                      </div>
                    </th>
                    <th onClick={() => handleClientSort('invoices')} className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted transition-colors">
                      <div className="flex items-center justify-end gap-1">
                        Invoices
                        <span className="text-[10px] text-primary">
                          {clientSortField === 'invoices' ? (clientSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                        </span>
                      </div>
                    </th>
                    <th onClick={() => handleClientSort('total')} className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted transition-colors">
                      <div className="flex items-center justify-end gap-1">
                        Total Amount
                        <span className="text-[10px] text-primary">
                          {clientSortField === 'total' ? (clientSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                        </span>
                      </div>
                    </th>
                    <th onClick={() => handleClientSort('paid')} className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted transition-colors">
                      <div className="flex items-center justify-end gap-1">
                        Paid
                        <span className="text-[10px] text-primary">
                          {clientSortField === 'paid' ? (clientSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                        </span>
                      </div>
                    </th>
                    <th onClick={() => handleClientSort('pending')} className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted transition-colors">
                      <div className="flex items-center justify-end gap-1">
                        Pending
                        <span className="text-[10px] text-primary">
                          {clientSortField === 'pending' ? (clientSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                        </span>
                      </div>
                    </th>
                    <th onClick={() => handleClientSort('rate')} className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted transition-colors rounded-tr-lg">
                      <div className="flex items-center justify-end gap-1">
                        Payment Rate
                        <span className="text-[10px] text-primary">
                          {clientSortField === 'rate' ? (clientSortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedClientsList.map((client, index) => {
                    const paymentRate = client.total_amount > 0 ? (client.paid_amount / client.total_amount) * 100 : 0;
                    return (
                      <tr key={index} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">{client.client_name}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{client.total_invoices}</td>
                        <td className="px-4 py-3 text-right font-bold text-foreground">{currencySymbol}{client.total_amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-success font-semibold">{currencySymbol}{client.paid_amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-warning font-semibold">{currencySymbol}{client.pending_amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${paymentRate >= 80 ? 'bg-success-light text-success' :
                            paymentRate >= 50 ? 'bg-warning-light text-warning' :
                              'bg-danger-light text-danger'
                            }`}>
                            {paymentRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <DataTablePagination
              currentPage={clientsReportPage}
              totalPages={Math.max(1, Math.ceil(filteredAndSortedClients.length / clientsReportPageSize))}
              totalCount={filteredAndSortedClients.length}
              pageSize={clientsReportPageSize}
              onPageChange={setClientsReportPage}
              onPageSizeChange={setClientsReportPageSize}
              entityName="clients"
            />
          </>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No client data available</p>
          </div>
        )}
      </Card>
    </div>
  );
};
