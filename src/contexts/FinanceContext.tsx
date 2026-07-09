/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import type { ClientItem, BankItem, RtgsItem, ExpenseItem } from '@/lib/supabase';

interface CalculationEntry {
  id: string;
  userId: string;
  date: string;
  time: string;
  A: number;
  C: number;
  A1: number;
  B1: number;
  C1: number;
  sumX: number;
  sumY: number;
  todayHisab: number;
  previousHisab?: number;
  difference?: number;
  clients?: ClientItem[];
  uplines?: ClientItem[];
  banks?: BankItem[];
  rtgs?: RtgsItem[];
  expenses?: ExpenseItem[];
}

interface FinanceContextType {
  entries: CalculationEntry[];
  addEntry: (entry: Omit<CalculationEntry, 'id' | 'date' | 'time'>) => Promise<boolean>;
  updateEntry: (id: string, entry: Partial<CalculationEntry>) => Promise<boolean>;
  deleteEntry: (id: string) => Promise<boolean>;
  getLastEntry: (userId: string) => CalculationEntry | null;
  getUserEntries: (userId: string) => CalculationEntry[];
  getTodayEntries: (userId: string) => CalculationEntry[];
  refreshEntries: () => Promise<void>;
  isLoading: boolean;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

function rowToEntry(row: any): CalculationEntry {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    time: row.time,
    A: row.a,
    C: row.c,
    A1: row.a1,
    B1: row.b1,
    C1: row.c1,
    sumX: row.sum_x,
    sumY: row.sum_y,
    todayHisab: row.today_hisab,
    previousHisab: row.previous_hisab,
    difference: row.difference,
    clients: row.clients ?? [],
    uplines: row.uplines ?? [],
    banks: row.banks ?? [],
    rtgs: row.rtgs ?? [],
    expenses: row.expenses ?? [],
  };
}

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const [entries, setEntries] = useState<CalculationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const refreshEntries = async (): Promise<void> => {
    if (!user?.id) { setEntries([]); return; }
    setIsLoading(true);
    const { data, error } = await supabase
      .from('calculations')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('time', { ascending: false });
    if (!error && data) setEntries(data.map(rowToEntry));
    setIsLoading(false);
  };

  useEffect(() => {
    if (user?.id) refreshEntries();
    else setEntries([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const addEntry = async (entryData: Omit<CalculationEntry, 'id' | 'date' | 'time'>): Promise<boolean> => {
    if (!user?.id) return false;
    setIsLoading(true);
    const now = new Date();
    const row = {
      id: `calc-${Date.now()}`,
      user_id: user.id,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      a: entryData.A || 0,
      c: entryData.C || 0,
      a1: entryData.A1 || 0,
      b1: entryData.B1 || 0,
      c1: entryData.C1 || 0,
      sum_x: entryData.sumX || 0,
      sum_y: entryData.sumY || 0,
      today_hisab: entryData.todayHisab || 0,
      previous_hisab: entryData.previousHisab,
      difference: entryData.difference,
      clients: entryData.clients ?? [],
      uplines: entryData.uplines ?? [],
      banks: entryData.banks ?? [],
      rtgs: entryData.rtgs ?? [],
      expenses: entryData.expenses ?? [],
    };
    const { data, error } = await supabase.from('calculations').insert(row).select().single();
    if (!error && data) setEntries((prev) => [rowToEntry(data), ...prev]);
    setIsLoading(false);
    return !error;
  };

  const updateEntry = async (id: string, updatedData: Partial<CalculationEntry>): Promise<boolean> => {
    if (!user?.id) return false;
    setIsLoading(true);
    const dbData: any = {};
    if (updatedData.A !== undefined) dbData.a = updatedData.A;
    if (updatedData.C !== undefined) dbData.c = updatedData.C;
    if (updatedData.A1 !== undefined) dbData.a1 = updatedData.A1;
    if (updatedData.B1 !== undefined) dbData.b1 = updatedData.B1;
    if (updatedData.C1 !== undefined) dbData.c1 = updatedData.C1;
    if (updatedData.sumX !== undefined) dbData.sum_x = updatedData.sumX;
    if (updatedData.sumY !== undefined) dbData.sum_y = updatedData.sumY;
    if (updatedData.todayHisab !== undefined) dbData.today_hisab = updatedData.todayHisab;
    if (updatedData.previousHisab !== undefined) dbData.previous_hisab = updatedData.previousHisab;
    if (updatedData.difference !== undefined) dbData.difference = updatedData.difference;
    if (updatedData.clients !== undefined) dbData.clients = updatedData.clients;
    if (updatedData.uplines !== undefined) dbData.uplines = updatedData.uplines;
    if (updatedData.banks !== undefined) dbData.banks = updatedData.banks;
    if (updatedData.rtgs !== undefined) dbData.rtgs = updatedData.rtgs;
    if (updatedData.expenses !== undefined) dbData.expenses = updatedData.expenses;

    const { data, error } = await supabase
      .from('calculations').update(dbData).eq('id', id).eq('user_id', user.id).select().single();
    if (!error && data) setEntries((prev) => prev.map((e) => e.id === id ? rowToEntry(data) : e));
    setIsLoading(false);
    return !error;
  };

  const deleteEntry = async (id: string): Promise<boolean> => {
    if (!user?.id) return false;
    setIsLoading(true);
    const { error } = await supabase.from('calculations').delete().eq('id', id).eq('user_id', user.id);
    if (!error) setEntries((prev) => prev.filter((e) => e.id !== id));
    setIsLoading(false);
    return !error;
  };

  const getLastEntry = (userId: string): CalculationEntry | null => {
    const sorted = entries
      .filter((e) => e.userId === userId)
      .sort((a, b) => new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime());
    return sorted[0] || null;
  };

  const getUserEntries = (userId: string): CalculationEntry[] =>
    entries
      .filter((e) => e.userId === userId)
      .sort((a, b) => new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime());

  const getTodayEntries = (userId: string): CalculationEntry[] => {
    const today = new Date().toISOString().split('T')[0];
    return entries
      .filter((e) => e.userId === userId && e.date === today)
      .sort((a, b) => new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime());
  };

  return (
    <FinanceContext.Provider value={{ entries, addEntry, updateEntry, deleteEntry, getLastEntry, getUserEntries, getTodayEntries, refreshEntries, isLoading }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be within FinanceProvider');
  return context;
};

export type { CalculationEntry };
