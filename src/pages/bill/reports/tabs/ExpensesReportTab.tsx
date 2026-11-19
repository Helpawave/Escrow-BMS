import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTablePagination } from '@/components/DataTablePagination';
import { ChartTooltip } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Receipt,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { CategoryData, ExpenseListItem } from '../types';

export interface ExpensesReportTabProps {
  exportExpensesExcel: () => void;
  exportExpensesPDF: (isPrint?: boolean) => void;
  currencySymbol: string;
  stats: {
    totalExpenses: number;
    [key: string]: any;
  };
  categoryData: CategoryData[];
  expensesList: ExpenseListItem[];
  selectedExpenseCategory: string;
  setSelectedExpenseCategory: (category: string) => void;
  filteredExpensesList: ExpenseListItem[];
  paginatedExpensesList: ExpenseListItem[];
  expensesReportPage: number;
  expensesReportPageSize: number;
  setExpensesReportPage: (page: number) => void;
  setExpensesReportPageSize: (size: number) => void;
  safelyToLocaleDate: (dateStr?: string | null) => string;
}

export const ExpensesReportTab: React.FC<ExpensesReportTabProps> = ({
  exportExpensesExcel,
  exportExpensesPDF,
  currencySymbol,
  stats,
  categoryData,
  expensesList,
  selectedExpenseCategory,
  setSelectedExpenseCategory,
  filteredExpensesList,
  paginatedExpensesList,
  expensesReportPage,
  expensesReportPageSize,
  setExpensesReportPage,
  setExpensesReportPageSize,
  safelyToLocaleDate,
}) => {
  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={exportExpensesExcel}
          className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
        >
          <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
          Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportExpensesPDF(false)}
          className="font-semibold text-xs rounded-xl border-border/70 hover:bg-muted"
        >
          <Download className="w-4 h-4 mr-1.5 text-rose-600" />
          PDF
        </Button>
        <Button
          size="sm"
          onClick={() => exportExpensesPDF(true)}
          className="font-semibold text-xs rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
        >
          <Printer className="w-4 h-4 mr-1.5" />
          Print
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="p-4 md:p-6 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/20 hover:border-rose-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-rose-500/5 cursor-default overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shrink-0 flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-muted-foreground font-semibold uppercase tracking-wider">Total Expenses</p>
              <p className="text-xl sm:text-2xl font-black text-foreground break-words leading-tight py-0.5 mt-0.5">{currencySymbol} {stats.totalExpenses.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 hover:border-blue-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/5 cursor-default overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-muted-foreground font-semibold uppercase tracking-wider">Top Category</p>
              <p className="text-xl sm:text-2xl font-black text-foreground break-words leading-tight py-0.5 mt-0.5" title={categoryData.length > 0 ? categoryData[0].name : 'N/A'}>
                {categoryData.length > 0 ? categoryData[0].name : 'N/A'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 hover:border-emerald-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/5 cursor-default overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-muted-foreground font-semibold uppercase tracking-wider">Expense Items</p>
              <p className="text-xl sm:text-2xl font-black text-foreground break-words leading-tight py-0.5 mt-0.5">{expensesList.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4 sm:p-6 bg-card">
          <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
          <div className="min-h-[300px] flex flex-col justify-center">
            {categoryData.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-full sm:w-1/2 h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color} 
                            className="cursor-pointer transition-all duration-300 hover:opacity-80"
                            onClick={() => setSelectedExpenseCategory(selectedExpenseCategory === entry.name ? 'all' : entry.name)}
                          />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border rounded-lg p-2 shadow-lg">
                                <p className="font-semibold">{payload[0].name}</p>
                                <p className="text-sm">{currencySymbol} {Number(payload[0].value).toLocaleString('en-IN')}</p>
                                <p className="text-xs text-muted-foreground">
                                  {((Number(payload[0].value) / stats.totalExpenses) * 100).toFixed(1)}% of total
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="w-full sm:w-1/2 space-y-2 max-h-[260px] overflow-y-auto pr-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground pb-1 border-b">
                    <span>Category</span>
                    <span>Amount</span>
                  </div>
                  {categoryData.map((cat) => {
                    const isSelected = selectedExpenseCategory === cat.name;
                    const percentage = stats.totalExpenses > 0 ? ((cat.value / stats.totalExpenses) * 100).toFixed(1) : 0;
                    return (
                      <button
                        key={cat.name}
                        onClick={() => setSelectedExpenseCategory(isSelected ? 'all' : cat.name)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all hover:bg-muted/50 text-left ${
                          isSelected ? 'bg-muted border border-muted-foreground/20 font-semibold shadow-sm' : 'border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="truncate">{cat.name}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">({percentage}%)</span>
                        </div>
                        <span className="font-mono flex-shrink-0">{currencySymbol}{cat.value.toLocaleString('en-IN')}</span>
                      </button>
                    );
                  })}
                  {selectedExpenseCategory !== 'all' && (
                    <button
                      onClick={() => setSelectedExpenseCategory('all')}
                      className="w-full text-center text-xs text-primary font-medium hover:underline pt-2"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-muted-foreground">
                No expense data found
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4 sm:p-6 bg-card overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Expense Items</h3>
            {selectedExpenseCategory !== 'all' && (
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                Filter: {selectedExpenseCategory}
              </span>
            )}
          </div>
          {filteredExpensesList.length > 0 ? (
            <div>
              <div className="space-y-4">
                {paginatedExpensesList.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-all duration-200">
                    <div className="min-w-0 flex-1 mr-4">
                      <p className="font-medium truncate">{exp.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium italic">
                          {exp.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {safelyToLocaleDate(exp.expense_date)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-danger">{currencySymbol} {exp.amount.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{exp.payment_method}</p>
                    </div>
                  </div>
                ))}
              </div>

              <DataTablePagination
                currentPage={expensesReportPage}
                totalPages={Math.max(1, Math.ceil(filteredExpensesList.length / expensesReportPageSize))}
                totalCount={filteredExpensesList.length}
                pageSize={expensesReportPageSize}
                onPageChange={setExpensesReportPage}
                onPageSizeChange={setExpensesReportPageSize}
                entityName="expenses"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No items listed
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
