import { supabase } from "@/integrations/supabase/client";

/**
 * Central ERP Auto-Posting Service
 * Connects all 6 Escrow BMS modules into a unified ERP ecosystem:
 * Billing <-> Ledger <-> Payroll <-> CRM <-> Inventory <-> Daily Hisab
 */

export interface ERPInvoicePostingPayload {
  invoiceId: string;
  invoiceNumber: string;
  partyName: string;
  amount: number;
  type: 'sales' | 'purchase';
  date?: string;
}

export interface ERPPaymentPostingPayload {
  invoiceNumber: string;
  partyName: string;
  amount: number;
  type: 'received' | 'paid';
  paymentMode?: string;
  date?: string;
}

export interface ERPPayrollPostingPayload {
  month: string;
  totalSalary: number;
  employeeCount: number;
}

export interface ERPHisabPostingPayload {
  partyName: string;
  amount: number;
  type: 'income' | 'expense';
  remarks?: string;
}

/**
 * 1. BILLING -> ACCOUNT LEDGER
 * Automatically posts a journal transaction to the Party's Ledger statement when an Invoice is issued.
 */
export async function postInvoiceToLedger(payload: ERPInvoicePostingPayload) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Find or create matching Party in Ledger
    let partyId: string | null = null;
    const { data: existingParties } = await supabase
      .from('parties')
      .select('id, party_name')
      .eq('user_id', user.id)
      .ilike('party_name', payload.partyName)
      .limit(1);

    if (existingParties && existingParties.length > 0) {
      partyId = existingParties[0].id;
    } else {
      // Auto-create Party in Ledger Master
      const { data: newParty, error: partyErr } = await supabase
        .from('parties')
        .insert([{
          user_id: user.id,
          party_name: payload.partyName,
          sr_no: String(Math.floor(1000 + Math.random() * 9000)),
          status: payload.type === 'sales' ? 'take' : 'give',
          commission_type: 'without',
          commission_rate: 0
        }])
        .select('id')
        .single();

      if (!partyErr && newParty) {
        partyId = newParty.id;
      }
    }

    if (!partyId) return;

    // Fetch latest balance for Party
    const { data: lastTns } = await supabase
      .from('transactions')
      .select('balance')
      .eq('party_id', partyId)
      .order('created_at', { ascending: false })
      .limit(1);

    const prevBal = lastTns && lastTns.length > 0 ? Number(lastTns[0].balance) || 0 : 0;
    const isSales = payload.type === 'sales';
    const debit = isSales ? payload.amount : 0;
    const credit = isSales ? 0 : payload.amount;
    const newBalance = isSales ? prevBal - debit : prevBal + credit;

    const tnsId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());

    await supabase.from('transactions').insert([{
      id: tnsId,
      user_id: user.id,
      party_id: partyId,
      linked_transaction_id: tnsId,
      remarks: `[ERP Auto] ${isSales ? 'Sales Invoice' : 'Purchase Bill'} #${payload.invoiceNumber}`,
      tns_type: isSales ? 'DR' : 'CR',
      debit,
      credit,
      balance: newBalance,
      transaction_date: payload.date || new Date().toISOString()
    }]);

  } catch (err) {
    console.error("ERP Auto-Posting to Ledger Error:", err);
  }
}

/**
 * 2. BILLING -> ACCOUNT LEDGER (PAYMENTS)
 * Automatically posts a payment transaction to the Party's Ledger when payment is received or made.
 */
export async function postPaymentToLedger(payload: ERPPaymentPostingPayload) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existingParties } = await supabase
      .from('parties')
      .select('id')
      .eq('user_id', user.id)
      .ilike('party_name', payload.partyName)
      .limit(1);

    if (!existingParties || existingParties.length === 0) return;
    const partyId = existingParties[0].id;

    const { data: lastTns } = await supabase
      .from('transactions')
      .select('balance')
      .eq('party_id', partyId)
      .order('created_at', { ascending: false })
      .limit(1);

    const prevBal = lastTns && lastTns.length > 0 ? Number(lastTns[0].balance) || 0 : 0;
    const isReceived = payload.type === 'received';
    const credit = isReceived ? payload.amount : 0;
    const debit = isReceived ? 0 : payload.amount;
    const newBalance = isReceived ? prevBal + credit : prevBal - debit;

    const tnsId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());

    await supabase.from('transactions').insert([{
      id: tnsId,
      user_id: user.id,
      party_id: partyId,
      linked_transaction_id: tnsId,
      remarks: `[ERP Auto] Payment ${isReceived ? 'Received' : 'Made'} (${payload.paymentMode || 'Cash'}) for Inv #${payload.invoiceNumber}`,
      tns_type: isReceived ? 'CR' : 'DR',
      credit,
      debit,
      balance: newBalance,
      transaction_date: payload.date || new Date().toISOString()
    }]);
  } catch (err) {
    console.error("ERP Payment Posting Error:", err);
  }
}

/**
 * 3. PAYROLL -> EXPENSES
 * Automatically posts monthly salary disbursals to Billing Expenses.
 */
export async function postPayrollToExpenses(payload: ERPPayrollPostingPayload) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('expenses').insert([{
      user_id: user.id,
      title: `Payroll Disbursal - ${payload.month} (${payload.employeeCount} Employees)`,
      amount: payload.totalSalary,
      category: 'Salaries & Payroll',
      expense_date: new Date().toISOString().split('T')[0],
      notes: `[ERP Auto-Generated] Monthly salary payout for ${payload.employeeCount} staff members.`
    }]);
  } catch (err) {
    console.error("ERP Payroll Expense Posting Error:", err);
  }
}

/**
 * 4. DAILY HISAB -> ACCOUNT LEDGER
 * Automatically posts Daily Hisab cash entries into the Party's Ledger.
 */
export async function postHisabToLedger(payload: ERPHisabPostingPayload) {
  try {
    if (!payload.partyName) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existingParties } = await supabase
      .from('parties')
      .select('id')
      .eq('user_id', user.id)
      .ilike('party_name', payload.partyName)
      .limit(1);

    if (!existingParties || existingParties.length === 0) return;
    const partyId = existingParties[0].id;

    const { data: lastTns } = await supabase
      .from('transactions')
      .select('balance')
      .eq('party_id', partyId)
      .order('created_at', { ascending: false })
      .limit(1);

    const prevBal = lastTns && lastTns.length > 0 ? Number(lastTns[0].balance) || 0 : 0;
    const isIncome = payload.type === 'income';
    const credit = isIncome ? payload.amount : 0;
    const debit = isIncome ? 0 : payload.amount;
    const newBalance = isIncome ? prevBal + credit : prevBal - debit;

    const tnsId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());

    await supabase.from('transactions').insert([{
      id: tnsId,
      user_id: user.id,
      party_id: partyId,
      linked_transaction_id: tnsId,
      remarks: `[ERP Hisab Auto] ${payload.remarks || 'Daily Hisab Entry'}`,
      tns_type: isIncome ? 'CR' : 'DR',
      credit,
      debit,
      balance: newBalance,
      transaction_date: new Date().toISOString()
    }]);
  } catch (err) {
    console.error("ERP Hisab Posting Error:", err);
  }
}
