import { supabase as baseSupabase } from "@/integrations/supabase/client";
const supabase = baseSupabase as any;

/**
 * Central ERP Auto-Posting Service
 * Connects all 6 Escrow BMS modules into a unified ERP ecosystem:
 * Billing <-> Ledger <-> Payroll <-> CRM <-> Inventory <-> Daily Hisab
 */

export interface ERPInvoicePostingPayload {
  invoiceId?: string;
  invoiceNumber: string;
  partyName: string;
  amount: number;
  type: 'sales' | 'purchase';
  date?: string;
  userId?: string;
}

export interface ERPPaymentPostingPayload {
  invoiceId?: string;
  invoiceNumber: string;
  partyName: string;
  amount: number;
  type: 'received' | 'paid';
  paymentMode?: string;
  date?: string;
  userId?: string;
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
    let targetUserId = payload.userId;
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      targetUserId = user?.id;
    }
    if (!targetUserId || !payload.partyName || !payload.amount) return;

    const trimmedName = payload.partyName.trim();
    if (!trimmedName) return;

    // Find or create matching Party in Ledger
    let partyId: string | null = null;
    const { data: existingParties } = await supabase
      .from('parties')
      .select('id, party_name')
      .eq('user_id', targetUserId)
      .ilike('party_name', trimmedName)
      .limit(1);

    if (existingParties && existingParties.length > 0) {
      partyId = existingParties[0].id;
    } else {
      // Auto-create Party in Ledger Master
      const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `party-${Date.now()}`;
      const { data: newParty, error: partyErr } = await supabase
        .from('parties')
        .insert([{
          id: newId,
          user_id: targetUserId,
          party_name: trimmedName,
          sr_no: String(Math.floor(1000 + Math.random() * 9000)),
          status: payload.type === 'sales' ? 'take' : 'give',
          commission_type: 'without',
          commission_rate: 0,
          balance: 0
        }])
        .select('id')
        .single();

      if (!partyErr && newParty) {
        partyId = newParty.id;
      } else {
        partyId = newId;
      }
    }

    if (!partyId) return;

    const isSales = payload.type === 'sales';
    const debit = isSales ? payload.amount : 0;
    const credit = isSales ? 0 : payload.amount;
    const invoiceRemark = `[ERP Auto] ${isSales ? 'Sales Invoice' : 'Purchase Bill'} #${payload.invoiceNumber}`;

    // Duplicate prevention: check if this invoice transaction already exists
    const { data: existingTxns } = await supabase
      .from('transactions')
      .select('id, amount')
      .eq('party_id', partyId)
      .ilike('remarks', `%#${payload.invoiceNumber}%`)
      .limit(1);

    if (existingTxns && existingTxns.length > 0) {
      // Already posted. If amount is the same, no need to re-post
      if (Math.round(Number(existingTxns[0].amount)) === Math.round(payload.amount)) {
        return;
      }
      // If amount changed (invoice updated), update the transaction
      await supabase
        .from('transactions')
        .update({
          amount: payload.amount,
          debit,
          credit,
          date: payload.date || new Date().toISOString(),
          transaction_date: payload.date || new Date().toISOString()
        })
        .eq('id', existingTxns[0].id);
    } else {
      // Insert new ledger transaction
      const tnsId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
      await supabase.from('transactions').insert([{
        id: tnsId,
        user_id: targetUserId,
        party_id: partyId,
        linked_transaction_id: tnsId,
        remarks: invoiceRemark,
        tns_type: isSales ? 'DR' : 'CR',
        debit,
        credit,
        amount: payload.amount,
        date: payload.date || new Date().toISOString(),
        transaction_date: payload.date || new Date().toISOString(),
        created_at: payload.date || new Date().toISOString()
      }]);
    }

    // Accurate recalculation of party balance from all transactions
    const { data: allPartyTxns } = await supabase
      .from('transactions')
      .select('credit, debit')
      .eq('party_id', partyId);

    const calculatedBalance = (allPartyTxns || []).reduce(
      (sum, t) => sum + (Number(t.credit) || 0) - (Number(t.debit) || 0),
      0
    );

    await supabase.from('parties').update({ balance: calculatedBalance }).eq('id', partyId);
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
    let targetUserId = payload.userId;
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      targetUserId = user?.id;
    }
    if (!targetUserId || !payload.partyName || !payload.amount) return;

    const trimmedName = payload.partyName.trim();
    if (!trimmedName) return;

    // Find party in Ledger
    let partyId = null;
    const { data: existingParties } = await supabase
      .from('parties')
      .select('id')
      .eq('user_id', targetUserId)
      .ilike('party_name', trimmedName)
      .limit(1);

    if (existingParties && existingParties.length > 0) {
      partyId = existingParties[0].id;
    } else {
      const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `party-${Date.now()}`;
      await supabase.from('parties').insert([{
        id: newId,
        user_id: targetUserId,
        party_name: trimmedName,
        sr_no: String(Math.floor(1000 + Math.random() * 9000)),
        status: payload.type === 'received' ? 'take' : 'give',
        commission_type: 'without',
        commission_rate: 0,
        balance: 0
      }]);
      partyId = newId;
    }

    if (!partyId) return;

    const isReceived = payload.type === 'received';
    const credit = isReceived ? payload.amount : 0;
    const debit = isReceived ? 0 : payload.amount;
    const paymentRemark = `[ERP Auto] Payment ${isReceived ? 'Received' : 'Made'} (${payload.paymentMode || 'Cash'}) for Inv #${payload.invoiceNumber}`;

    // Duplicate check for payments on same invoice
    const { data: existingPayTxns } = await supabase
      .from('transactions')
      .select('id, amount')
      .eq('party_id', partyId)
      .ilike('remarks', `%Payment%#${payload.invoiceNumber}%`)
      .limit(1);

    if (existingPayTxns && existingPayTxns.length > 0) {
      if (Math.round(Number(existingPayTxns[0].amount)) === Math.round(payload.amount)) {
        return;
      }
      await supabase
        .from('transactions')
        .update({
          amount: payload.amount,
          credit,
          debit,
          remarks: paymentRemark,
          date: payload.date || new Date().toISOString(),
          transaction_date: payload.date || new Date().toISOString()
        })
        .eq('id', existingPayTxns[0].id);
    } else {
      const tnsId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
      await supabase.from('transactions').insert([{
        id: tnsId,
        user_id: targetUserId,
        party_id: partyId,
        linked_transaction_id: tnsId,
        remarks: paymentRemark,
        tns_type: isReceived ? 'CR' : 'DR',
        credit,
        debit,
        amount: payload.amount,
        date: payload.date || new Date().toISOString(),
        transaction_date: payload.date || new Date().toISOString(),
        created_at: payload.date || new Date().toISOString()
      }]);
    }

    // Accurate recalculation of party balance from all transactions
    const { data: allPartyTxns } = await supabase
      .from('transactions')
      .select('credit, debit')
      .eq('party_id', partyId);

    const calculatedBalance = (allPartyTxns || []).reduce(
      (sum, t) => sum + (Number(t.credit) || 0) - (Number(t.debit) || 0),
      0
    );

    await supabase.from('parties').update({ balance: calculatedBalance }).eq('id', partyId);
  } catch (err) {
    console.error("ERP Payment Posting Error:", err);
  }
}

/**
 * 2B. BILLING -> ACCOUNT LEDGER (DELETE/REVERSE)
 * Removes auto-posted invoice transactions from the Party's Ledger when an Invoice is deleted.
 */
export async function removeInvoiceFromLedger(invoiceNumber: string, partyName?: string, userId?: string) {
  try {
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      targetUserId = user?.id;
    }
    if (!targetUserId || !invoiceNumber) return;

    const pattern = `%#${invoiceNumber}%`;
    const { data: txnsToDelete } = await supabase
      .from('transactions')
      .select('id, party_id')
      .eq('user_id', targetUserId)
      .ilike('remarks', pattern);

    if (txnsToDelete && txnsToDelete.length > 0) {
      const partyIds = Array.from(new Set(txnsToDelete.map((t) => t.party_id)));
      const txnIds = txnsToDelete.map((t) => t.id);

      await supabase.from('transactions').delete().in('id', txnIds);

      for (const pId of partyIds) {
        const { data: remainingTxns } = await supabase
          .from('transactions')
          .select('credit, debit')
          .eq('party_id', pId);

        const newBal = (remainingTxns || []).reduce(
          (sum, t) => sum + (Number(t.credit) || 0) - (Number(t.debit) || 0),
          0
        );

        await supabase.from('parties').update({ balance: newBal }).eq('id', pId);
      }
    }
  } catch (err) {
    console.error("removeInvoiceFromLedger error:", err);
  }
}

/**
 * Common Master Party & Client Synchronization
 * Guarantees that any party created in Ledger appears in Invoices/Clients,
 * and any client created in Invoices appears in Ledger.
 */
export async function syncClientsAndLedgerParties(userId: string) {
  if (!userId) return;
  try {
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name, phone')
      .eq('user_id', userId);

    const { data: parties } = await supabase
      .from('parties')
      .select('id, party_name, phone, status, balance, system_type')
      .eq('user_id', userId);

    const clientNameMap = new Map();
    (clients || []).forEach((c) => {
      const k = (c.name || '').trim().toLowerCase();
      if (k) clientNameMap.set(k, c);
    });

    const partyNameMap = new Map();
    (parties || []).forEach((p) => {
      const k = (p.party_name || '').trim().toLowerCase();
      if (k) partyNameMap.set(k, p);
    });

    // 1. Sync from parties -> clients
    const missingInClients = (parties || []).filter((p) => {
      const k = (p.party_name || '').trim().toLowerCase();
      return k && !clientNameMap.has(k) && p.system_type !== 'commission';
    });

    if (missingInClients.length > 0) {
      const toInsertClients = missingInClients.map((p) => ({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `client-${Date.now()}-${Math.random()}`,
        user_id: userId,
        name: p.party_name.trim(),
        phone: p.phone || '',
        email: '',
        address: '',
        pending_amount: Math.abs(Number(p.balance) || 0)
      }));
      await supabase.from('clients').insert(toInsertClients);
    }

    // 2. Sync from clients -> parties
    const missingInParties = (clients || []).filter((c) => {
      const k = (c.name || '').trim().toLowerCase();
      return k && !partyNameMap.has(k);
    });

    if (missingInParties.length > 0) {
      const toInsertParties = missingInParties.map((c) => ({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `party-${Date.now()}-${Math.random()}`,
        user_id: userId,
        sr_no: String(Math.floor(1000 + Math.random() * 9000)),
        party_name: c.name.trim(),
        phone: c.phone || '',
        status: 'take',
        balance: 0,
        commission_type: 'without',
        commission_rate: 0
      }));
      await supabase.from('parties').insert(toInsertParties);
    }
  } catch (err) {
    console.warn("syncClientsAndLedgerParties warning:", err);
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

    // 1. Post to Billing Expenses
    try {
      await supabase.from('expenses').insert([{
        user_id: user.id,
        title: `Payroll Disbursal - ${payload.month} (${payload.employeeCount} Employees)`,
        amount: payload.totalSalary,
        category: 'Salaries & Payroll',
        expense_date: new Date().toISOString().split('T')[0],
        date: new Date().toISOString().split('T')[0],
        notes: `[ERP Auto-Generated] Monthly salary payout for ${payload.employeeCount} staff members.`
      }]);
    } catch (expErr) {
      console.warn("Expenses post warning:", expErr);
    }

    // 2. Save to local storage disbursals log
    try {
      const saved = localStorage.getItem('erp_payroll_disbursals_history_v1');
      const list = saved ? JSON.parse(saved) : [];
      list.unshift({
        id: `payout-${Date.now()}`,
        month: payload.month,
        amount: payload.totalSalary,
        employeeCount: payload.employeeCount,
        disbursedAt: new Date().toISOString()
      });
      localStorage.setItem('erp_payroll_disbursals_history_v1', JSON.stringify(list));
    } catch (lsErr) { }
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

    const { data: partyData } = await supabase
      .from('parties')
      .select('balance')
      .eq('id', partyId)
      .maybeSingle();

    const prevBal = partyData ? Number(partyData.balance) || 0 : 0;
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
      amount: payload.amount,
      date: new Date().toISOString(),
      transaction_date: new Date().toISOString(),
      created_at: new Date().toISOString()
    }]);

    await supabase.from('parties').update({ balance: newBalance }).eq('id', partyId);
  } catch (err) {
    console.error("ERP Hisab Posting Error:", err);
  }
}

export interface ERPUserSyncPayload {
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isTeamMember?: boolean;
  role?: string;
  status?: 'take' | 'give';
}

export interface ERPMemberSyncPayload {
  name: string;
  email: string;
  department?: string;
  designation?: string;
  role?: string;
  salary?: number;
}

/**
 * 5. UNIVERSAL USER & CLIENT SYNC
 * Synchronizes new system users/clients across Escrow Billing (clients), Ledger (parties & accounts), CRM (leads), and Directory (profiles).
 * Note: Invited team members/staff use existing Admin parties and do not create separate duplicate parties.
 */
export async function syncUserAcrossAllModules(payload: ERPUserSyncPayload) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let userId = user.id;
    try {
      const { data: prof } = await supabase.from('profiles').select('parent_user_id').eq('id', userId).maybeSingle();
      if (prof?.parent_user_id) {
        userId = prof.parent_user_id;
      }
    } catch {}

    const trimmedName = payload.name.trim();
    const trimmedEmail = payload.email.trim();
    if (!trimmedName) return;

    // Check if this payload represents an invited team member or staff
    const isTeamMember = payload.isTeamMember || ['member', 'employee', 'staff', 'sub_user'].includes(payload.role?.toLowerCase() || '');
    const isVendor = payload.status === 'give' || payload.role?.toLowerCase() === 'vendor';

    if (userId) {
      if (isVendor) {
        // 1a. Sync to Escrow Billing (vendors table)
        try {
          const { data: existingVendorList } = await supabase
            .from('vendors')
            .select('id')
            .eq('user_id', userId)
            .ilike('name', trimmedName)
            .limit(1);

          if (!existingVendorList || existingVendorList.length === 0) {
            await supabase.from('vendors').insert([{
              id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ven-${Date.now()}`,
              user_id: userId,
              name: trimmedName,
              email: trimmedEmail,
              phone: payload.phone || '',
              company_name: payload.companyName || trimmedName,
              address: payload.address || '',
              city: payload.city || '',
              state: payload.state || '',
              postal_code: payload.postalCode || '',
              country: payload.country || 'India',
              gstin: payload.gstin || ''
            }]);
          }

          // Ensure removed from clients table if converted
          await supabase
            .from('clients')
            .delete()
            .eq('user_id', userId)
            .ilike('name', trimmedName);
        } catch (vErr) {
          console.warn("Universal Sync to Vendors warning:", vErr);
        }
      } else {
        // 1b. Sync to Escrow Billing (clients table) - ONLY for clients, never vendors
        try {
          // Check if party is already a vendor; if so, do not add as client
          const { data: isAlreadyVendorList } = await supabase
            .from('vendors')
            .select('id')
            .eq('user_id', userId)
            .ilike('name', trimmedName)
            .limit(1);

          if (!isAlreadyVendorList || isAlreadyVendorList.length === 0) {
            const { data: existingClientList } = await supabase
              .from('clients')
              .select('id')
              .eq('user_id', userId)
              .ilike('name', trimmedName)
              .limit(1);

            if (!existingClientList || existingClientList.length === 0) {
              const { error: cliErr } = await supabase.from('clients').insert([{
                id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cli-${Date.now()}`,
                user_id: userId,
                name: trimmedName,
                email: trimmedEmail,
                phone: payload.phone || '',
                company_name: payload.companyName || '',
                gstin: payload.gstin || '',
                address: payload.address || '',
                city: payload.city || '',
                state: payload.state || '',
                postal_code: payload.postalCode || '',
                country: payload.country || 'India'
              }]);

              if (cliErr) {
                // Secondary check before fallback to avoid duplicate insertion
                const { data: checkAgain } = await supabase
                  .from('clients')
                  .select('id')
                  .eq('user_id', userId)
                  .ilike('name', trimmedName)
                  .limit(1);

                if (!checkAgain || checkAgain.length === 0) {
                  await supabase.from('clients').insert([{
                    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cli-${Date.now()}`,
                    user_id: userId,
                    name: trimmedName,
                    email: trimmedEmail,
                    phone: payload.phone || ''
                  }]);
                }
              }
            }
          }
        } catch (cErr) {
          console.warn("Universal Sync to Clients warning:", cErr);
        }
      }

      // 2. Sync to Account Ledger (parties table - ALL parties stay in ledger, whether vendor or client!)
      if (!isTeamMember) {
        try {
          const { data: existingPartyList } = await supabase
            .from('parties')
            .select('id, status')
            .eq('user_id', userId)
            .ilike('party_name', trimmedName)
            .limit(1);

          if (!existingPartyList || existingPartyList.length === 0) {
            const partyStatus = payload.status || (isVendor ? 'give' : 'take');
            await supabase.from('parties').insert([
              {
                id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `party-${partyStatus}-${Date.now()}`,
                user_id: userId,
                sr_no: String(Math.floor(1000 + Math.random() * 9000)),
                party_name: trimmedName,
                status: partyStatus,
                commission_type: 'without',
                commission_rate: 0
              }
            ]);
          } else if (isVendor && existingPartyList[0].status !== 'give') {
            // Update party status in Account Ledger without resetting balance or transactions
            await supabase.from('parties').update({ status: 'give' }).eq('id', existingPartyList[0].id);
          }
        } catch (pErr) {
          console.warn("Universal Sync to Parties warning:", pErr);
        }
      }

      // 3. Sync to CRM (leads table)
      try {
        const { data: existingLeadList } = await supabase
          .from('leads')
          .select('id')
          .eq('user_id', userId)
          .ilike('name', trimmedName)
          .limit(1);

        if (!existingLeadList || existingLeadList.length === 0) {
          await supabase.from('leads').insert([{
            id: `lead-${Date.now()}`,
            user_id: userId,
            name: trimmedName,
            email: trimmedEmail,
            phone: payload.phone || '',
            company: payload.companyName || trimmedName,
            status: 'new',
            value: 0,
            source: 'Universal Directory',
            created_date: new Date().toISOString().split('T')[0]
          }]);
        }
      } catch (lErr) {
        console.warn("Universal Sync to Leads warning:", lErr);
      }
    }

    // 4. Save to local storage cache for offline/instant directory render
    try {
      const saved = localStorage.getItem('synced_universal_users_v1');
      let list = saved ? JSON.parse(saved) : [];
      if (!list.some((u: any) => u.full_name?.toLowerCase() === trimmedName.toLowerCase() || (trimmedEmail && u.email?.toLowerCase() === trimmedEmail.toLowerCase()))) {
        list.push({
          id: `user-${Date.now()}`,
          full_name: trimmedName,
          email: trimmedEmail || `${trimmedName.toLowerCase().replace(/\s+/g, '')}@system.co`,
          company_name: payload.companyName || 'Registered Account',
          role: 'user',
          created_at: new Date().toISOString().substring(0, 10)
        });
        localStorage.setItem('synced_universal_users_v1', JSON.stringify(list));
      }
    } catch (lsErr) { }

  } catch (err) {
    console.error("Error in syncUserAcrossAllModules:", err);
  }
}

/**
 * 6. MEMBER TO PAYROLL EMPLOYEES SYNC
 * Synchronizes department members added in MembersPage into Payroll Employees table & local cache.
 */
export async function syncMemberToPayroll(payload: ERPMemberSyncPayload) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    const trimmedName = payload.name.trim();
    const trimmedEmail = payload.email.trim();
    if (!trimmedName) return;

    // 1. Sync to Supabase employees table
    if (userId) {
      try {
        const { data: existingEmp } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', userId)
          .eq('email', trimmedEmail)
          .maybeSingle();

        if (!existingEmp) {
          await supabase.from('employees').insert([{
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `emp-${Date.now()}`,
            user_id: userId,
            name: trimmedName,
            email: trimmedEmail,
            department: payload.department || 'General Operations',
            designation: payload.designation || 'Department Staff',
            status: 'Active',
            salary: payload.salary || 45000,
            join_date: new Date().toISOString().substring(0, 10)
          }]);
        }
      } catch (empErr) {
        console.warn("Member to Payroll Sync Warning:", empErr);
      }
    }

    // 2. Sync to local storage for payroll employees cache
    try {
      const savedEmps = localStorage.getItem('synced_payroll_employees_v1');
      let emps = savedEmps ? JSON.parse(savedEmps) : [];
      if (!emps.some((e: any) => e.email?.toLowerCase() === trimmedEmail.toLowerCase())) {
        emps.push({
          id: `emp-sync-${Date.now()}`,
          name: trimmedName,
          email: trimmedEmail,
          department: payload.department || 'General Operations',
          designation: payload.designation || 'Department Staff',
          salary: '₹45,000',
          status: 'Active',
          joinDate: new Date().toISOString().substring(0, 10)
        });
        localStorage.setItem('synced_payroll_employees_v1', JSON.stringify(emps));
      }
    } catch (lsErr) { }

  } catch (err) {
    console.error("Error in syncMemberToPayroll:", err);
  }
}

export interface ERPUserUpdatePayload {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  department?: string;
  designation?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  allowedModules?: string[];
}

/**
 * 7. UNIFIED UNIVERSAL EDIT USER & MEMBER SYNC
 * Updates a person's profile across all modules simultaneously:
 * Supabase clients, parties, employees, profiles, & local caches.
 */
export async function updateUserAcrossAllModules(payload: ERPUserUpdatePayload) {
  try {
    const isUUID = (str?: string) => !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const trimmedName = payload.name.trim();
    const trimmedEmail = payload.email.trim();

    // 1. Update Clients Table
    try {
      const clientData = {
        name: trimmedName,
        email: trimmedEmail,
        phone: payload.phone || '',
        company_name: payload.companyName || '',
        gstin: payload.gstin || '',
        address: payload.address || '',
        city: payload.city || '',
        state: payload.state || '',
        postal_code: payload.postalCode || '',
        country: payload.country || 'India'
      };
      if (isUUID(payload.id)) {
        await supabase.from('clients').update(clientData).eq('id', payload.id);
      } else if (trimmedEmail) {
        await supabase.from('clients').update(clientData).eq('email', trimmedEmail);
      } else {
        await supabase.from('clients').update(clientData).ilike('name', trimmedName);
      }
    } catch (cErr) { }

    // 2. Update Parties Table
    try {
      if (isUUID(payload.id)) {
        await supabase.from('parties').update({ party_name: trimmedName }).eq('id', payload.id);
      } else {
        await supabase.from('parties').update({ party_name: trimmedName }).ilike('party_name', trimmedName);
      }
    } catch (pErr) { }

    // 3. Update Employees Table
    try {
      const empData = {
        name: trimmedName,
        email: trimmedEmail,
        department: payload.department || 'General Operations',
        designation: payload.designation || 'Department Staff',
        phone: payload.phone || ''
      };
      if (isUUID(payload.id)) {
        await supabase.from('employees').update(empData).eq('id', payload.id);
      } else if (trimmedEmail) {
        await supabase.from('employees').update(empData).eq('email', trimmedEmail);
      } else {
        await supabase.from('employees').update(empData).ilike('name', trimmedName);
      }
    } catch (eErr) { }

    // 4. Update Profiles Table
    try {
      if (isUUID(payload.id)) {
        await supabase.from('profiles').update({ full_name: trimmedName, company_name: payload.companyName }).eq('id', payload.id);
      }
    } catch (prErr) { }

    // 5. Update Local Members Cache
    try {
      const savedMembers = localStorage.getItem('company_department_invited_members_v2');
      if (savedMembers) {
        let members = JSON.parse(savedMembers);
        members = members.map((m: any) => {
          if (m.id === payload.id || (trimmedEmail && m.email?.toLowerCase() === trimmedEmail.toLowerCase()) || m.full_name?.toLowerCase() === trimmedName.toLowerCase()) {
            return {
              ...m,
              full_name: trimmedName,
              email: trimmedEmail || m.email,
              department: payload.department || m.department,
              allowed_modules: payload.allowedModules || m.allowed_modules
            };
          }
          return m;
        });
        localStorage.setItem('company_department_invited_members_v2', JSON.stringify(members));
      }
    } catch (mErr) { }

    // 6. Update Local Universal Users Cache
    try {
      const savedUsers = localStorage.getItem('synced_universal_users_v1');
      if (savedUsers) {
        let users = JSON.parse(savedUsers);
        users = users.map((u: any) => {
          if (u.id === payload.id || (trimmedEmail && u.email?.toLowerCase() === trimmedEmail.toLowerCase()) || u.full_name?.toLowerCase() === trimmedName.toLowerCase()) {
            return {
              ...u,
              full_name: trimmedName,
              email: trimmedEmail || u.email,
              phone: payload.phone || u.phone,
              company_name: payload.companyName || u.company_name,
              gstin: payload.gstin || u.gstin,
              address: payload.address || u.address,
              city: payload.city || u.city,
              state: payload.state || u.state,
              postal_code: payload.postalCode || u.postal_code,
              country: payload.country || u.country
            };
          }
          return u;
        });
        localStorage.setItem('synced_universal_users_v1', JSON.stringify(users));
      }
    } catch (uErr) { }

    // 7. Update Permissions Key
    if (payload.id && payload.allowedModules) {
      localStorage.setItem(`bms_permissions_${payload.id}`, JSON.stringify(payload.allowedModules));
    }
  } catch (err) {
    console.error("Unified Update Error:", err);
  }
}

/**
 * 7. AUTO INITIALIZE 2 DEFAULT LEDGER PARTIES — Exactly like Account Ledger:
 *   - SYS-01: "Commission" (system_type: commission)
 *   - SYS-02: Company name party (system_type: company)
 * Only created if they don't already exist for this user.
 */
export async function ensureDefaultLedgerParties(userId: string) {
  if (!userId) return;
  try {
    // Fetch user's profile to get company name and check if user is a team member
    const { data: profileData } = await (supabase as any)
      .from('profiles')
      .select('company_name, parent_user_id, role')
      .eq('id', userId)
      .maybeSingle();

    // If user is a team member of a company (has parent_user_id or member role), DO NOT create independent parties!
    if (profileData?.parent_user_id || profileData?.role === 'member') {
      return;
    }

    const companyName = profileData?.company_name || 'My Company';

    // Check which system parties already exist
    const { data: existingParties } = await (supabase as any)
      .from('parties')
      .select('system_type, sr_no, party_name')
      .eq('user_id', userId);

    const existingTypes = new Set((existingParties || []).map((p: any) => p.system_type));
    const existingSrNos = new Set((existingParties || []).map((p: any) => p.sr_no));
    const toInsert: any[] = [];

    // SYS-01: Commission party
    if (!existingTypes.has('commission') && !existingSrNos.has('SYS-01')) {
      toInsert.push({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined,
        user_id: userId,
        sr_no: 'SYS-01',
        party_name: 'Commission',
        status: 'give',
        commission_type: 'without',
        commission_rate: 0,
        system_type: 'commission'
      });
    }

    // SYS-02: Company party (named after user's company)
    if (!existingTypes.has('company') && !existingSrNos.has('SYS-02')) {
      toInsert.push({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined,
        user_id: userId,
        sr_no: 'SYS-02',
        party_name: companyName,
        status: 'give',
        commission_type: 'without',
        commission_rate: 0,
        system_type: 'company'
      });
    }

    if (toInsert.length > 0) {
      await (supabase as any).from('parties').insert(toInsert);
    }
  } catch (err) {
    console.warn('Auto ledger parties initialization warning:', err);
  }
}
