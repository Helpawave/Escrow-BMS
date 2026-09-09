import { supabase, serviceSupabase } from "@/integrations/supabase/client";

/**
 * Calculates the total amount for a single invoice item including discount and tax.
 */
export const calculateItemAmount = (quantity: number, rate: number, discount: number, taxRate: number) => {
  const subtotal = quantity * rate;
  const discountAmount = (subtotal * discount) / 100;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = (afterDiscount * taxRate) / 100;
  return afterDiscount + taxAmount;
};

/**
 * Generates a new unique, scalable invoice or purchase bill number for the company/user.
 * Format scales gracefully from INV-0001 up to INV-9999, INV-10000, INV-100000+ without limits.
 * Fully supports overloading:
 * - generateInvoiceNumber('INV')
 * - generateInvoiceNumber(userId, isPurchase, customPrefix)
 */
export const generateInvoiceNumber = async (
  targetUserIdOrPrefix?: string,
  isPurchase: boolean = false,
  customPrefix?: string
): Promise<string> => {
  const clientToUse = (serviceSupabase || supabase) as any;
  
  let targetUserId: string | undefined = targetUserIdOrPrefix;
  let prefix = customPrefix;

  // Detect if first argument is a short prefix like 'INV', 'PUR', 'QT', 'LB', 'PB'
  if (targetUserIdOrPrefix && targetUserIdOrPrefix.length <= 8 && !targetUserIdOrPrefix.includes('-')) {
    prefix = targetUserIdOrPrefix;
    targetUserId = undefined;
  }

  const isPurchaseTable = isPurchase || (prefix === 'PUR' || prefix === 'PB');
  const table = isPurchaseTable ? 'purchase_invoices' : 'invoices';
  const defaultPrefix = isPurchaseTable ? 'PB' : 'INV';
  const finalPrefix = prefix || defaultPrefix;

  try {
    let query = clientToUse
      .from(table)
      .select('invoice_number');

    if (targetUserId) {
      query = query.eq('user_id', targetUserId);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(500);

    if (error) {
      console.error('Error fetching latest invoice for generation:', error);
      return `${finalPrefix}-${Date.now().toString().slice(-6)}`;
    }

    const existingNumbers = new Set<string>();
    let maxSequentialNum = 0;

    const rows = (data as unknown as { invoice_number?: string }[]) || [];
    if (rows && rows.length > 0) {
      for (const row of rows) {
        if (row?.invoice_number) {
          existingNumbers.add(row.invoice_number.trim());
          // Extract sequential integer part from any past format (e.g. INV-001, INV-0007, INV-15, PB-0023)
          const match = row.invoice_number.match(/(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxSequentialNum) {
              maxSequentialNum = num;
            }
          }
        }
      }
    }

    // Determine next sequential integer
    let candidateNum = maxSequentialNum + 1;
    
    // Scale-proof formatting: 4-digit minimum padding, auto-expanding for 10,000+
    const formatNumber = (n: number) => `${finalPrefix}-${n.toString().padStart(4, '0')}`;
    let candidateStr = formatNumber(candidateNum);

    // Ensure candidate doesn't collide with any existing numbers (including 3-digit legacy e.g. INV-016)
    while (
      existingNumbers.has(candidateStr) ||
      existingNumbers.has(`${finalPrefix}-${candidateNum.toString().padStart(3, '0')}`) ||
      existingNumbers.has(`${finalPrefix}-${candidateNum.toString()}`)
    ) {
      candidateNum++;
      candidateStr = formatNumber(candidateNum);
    }

    // Direct database existence check for complete safety
    let isUnique = false;
    let safetyCheckCount = 0;

    while (!isUnique && safetyCheckCount < 10) {
      safetyCheckCount++;
      let checkQuery = clientToUse
        .from(table)
        .select('id')
        .eq('invoice_number', candidateStr);

      if (targetUserId) {
        checkQuery = checkQuery.eq('user_id', targetUserId);
      }

      const { data: existingRecord } = await checkQuery.maybeSingle();

      if (existingRecord) {
        candidateNum++;
        candidateStr = formatNumber(candidateNum);
      } else {
        isUnique = true;
      }
    }

    return candidateStr;
  } catch (err) {
    console.error('Error generating invoice number:', err);
    return `${finalPrefix}-${Date.now().toString().slice(-6)}`;
  }
};
