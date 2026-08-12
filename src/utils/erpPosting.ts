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
    const userId = user?.id;

    const trimmedName = payload.name.trim();
    const trimmedEmail = payload.email.trim();
    if (!trimmedName) return;

    // Check if this payload represents an invited team member or staff
    const isTeamMember = payload.isTeamMember || ['member', 'employee', 'staff', 'sub_user'].includes(payload.role?.toLowerCase() || '');

    // 1. Sync to Escrow Billing (clients table)
    if (userId) {
      try {
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', userId)
          .ilike('name', trimmedName)
          .maybeSingle();

        if (!existingClient) {
          await supabase.from('clients').insert([{
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
        }
      } catch (cErr) {
        console.warn("Universal Sync to Clients warning:", cErr);
      }

      // 2. Sync to Account Ledger (parties table - skip for invited team members so they share Admin parties)
      if (!isTeamMember) {
        try {
          const { data: existingParty } = await supabase
            .from('parties')
            .select('id')
            .eq('user_id', userId)
            .ilike('party_name', trimmedName)
            .maybeSingle();

          if (!existingParty) {
            await supabase.from('parties').insert([
              {
                id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `party-take-${Date.now()}`,
                user_id: userId,
                sr_no: String(Math.floor(1000 + Math.random() * 9000)),
                party_name: trimmedName,
                status: 'take',
                commission_type: 'with',
                commission_rate: 3.5
              },
              {
                id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `party-give-${Date.now()}`,
                user_id: userId,
                sr_no: String(Math.floor(1000 + Math.random() * 9000)),
                party_name: `${trimmedName} (Vendor / Give)`,
                status: 'give',
                commission_type: 'with',
                commission_rate: 1.0
              }
            ]);
          }
        } catch (pErr) {
          console.warn("Universal Sync to Parties warning:", pErr);
        }
      }

      // 3. Sync to CRM (leads table)
      try {
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id')
          .eq('user_id', userId)
          .ilike('name', trimmedName)
          .maybeSingle();

        if (!existingLead) {
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
 * 7. AUTO INITIALIZE 2 DEFAULT LEDGER PARTIES — Exactly like the reference project's
 * Supabase `handle_new_user()` trigger in supabase_advanced_ledger.sql:
 *   - SYS-01: "Commission" (system_type: commission)
 *   - SYS-02: Company name party (system_type: company)
 * Only created if they don't already exist for this user.
 */
export async function ensureDefaultLedgerParties(userId: string) {
  if (!userId) return;
  try {
    // Fetch user's profile to get company name and check if user is a team member
    const { data: profileData } = await supabase
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
    const { data: existingParties } = await supabase
      .from('parties')
      .select('system_type')
      .eq('user_id', userId)
      .in('system_type', ['commission', 'company']);

    const existingTypes = new Set((existingParties || []).map((p: any) => p.system_type));
    const toInsert: any[] = [];

    // SYS-01: Commission party
    if (!existingTypes.has('commission')) {
      toInsert.push({
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
    if (!existingTypes.has('company')) {
      toInsert.push({
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
      await supabase.from('parties').insert(toInsert);
    }
  } catch (err) {
    console.warn('Auto ledger parties initialization warning:', err);
  }
}
