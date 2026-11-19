export interface QRToken {
  id: string;
  product_id: string;
  sku: string;
  token: string;
  status: string | null;
  created_at: string | null;
  used_at: string | null;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount?: number;
  tax_rate: number;
  unit: string;
  category: string;
  type?: string;
  opening_stock?: string;
  purchase_price?: number;
  sku?: string;
  hsn_code?: string;
  low_stock_warning?: boolean;
  created_at?: string;
  vendor_id?: string;
  image_url?: string;
}

export interface ProductFormData {
  name: string;
  type: string;
  category: string;
  price: string;
  price_with_tax: boolean;
  tax_rate: string;
  unit: string;
  opening_stock: string;
  description: string;
  purchase_price: string;
  sku: string;
  discount: string;
  hsn_code: string;
  barcode: string;
  alternative_unit: string;
  as_of_date: string;
  low_stock_warning: boolean;
  vendor_id: string;
  image_url?: string;
}

const toLocalYMD = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function getDateBounds(dateFilter?: string, customStart?: string, customEnd?: string): { from: string | null; to: string | null } {
  if (!dateFilter || dateFilter === 'all') return { from: null, to: null };
  const now = new Date();

  if (dateFilter === 'today') {
    const todayStr = toLocalYMD(now);
    return { from: todayStr, to: todayStr };
  }

  if (dateFilter === 'this_week') {
    const d = new Date(now);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    const mondayStr = toLocalYMD(d);
    const todayStr = toLocalYMD(now);
    return { from: mondayStr, to: todayStr };
  }

  if (dateFilter === 'this_month') {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const startStr = `${y}-${m}-01`;
    const todayStr = toLocalYMD(now);
    return { from: startStr, to: todayStr };
  }

  if (dateFilter === 'last_month') {
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const y = prevMonth.getFullYear();
    const m = String(prevMonth.getMonth() + 1).padStart(2, '0');
    const startStr = `${y}-${m}-01`;
    const endStr = toLocalYMD(lastDayPrevMonth);
    return { from: startStr, to: endStr };
  }

  if (dateFilter === 'custom') {
    return { from: customStart || null, to: customEnd || null };
  }

  return { from: null, to: null };
}
