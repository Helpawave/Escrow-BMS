
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Users, Package, CreditCard, Receipt } from 'lucide-react';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { InvoicePreview } from './InvoicePreview';

interface SearchResult {
    id: string;
    invoice_number?: string;
    status?: string;
    total_amount?: number;
    name?: string;
    email?: string;
    phone?: string;
    gstin?: string;
    title?: string;
    category?: string;
    amount?: number;
    sku?: string;
    price?: number;
    description?: string;
    clients?: { name: string };
    vendors?: { name: string };
}

export function GlobalSearch() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [invoices, setInvoices] = useState<SearchResult[]>([]);
    const [clients, setClients] = useState<SearchResult[]>([]);
    const [products, setProducts] = useState<SearchResult[]>([]);
    const [expenses, setExpenses] = useState<SearchResult[]>([]);
    const [vendors, setVendors] = useState<SearchResult[]>([]);
    const [purchaseInvoices, setPurchaseInvoices] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<SearchResult | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                inputRef.current?.focus();
                setOpen(true);
            }
            if (e.key === "Escape") {
                setOpen(false);
                inputRef.current?.blur();
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const fetchData = useCallback(async (searchQuery: string) => {
        setLoading(true);
        try {
            let matchedClientIds: string[] = [];
            if (searchQuery) {
                const { data: clientsData } = await supabase
                    .from('clients')
                    .select('id')
                    .eq('user_id', user!.id)
                    .ilike('name', `%${searchQuery}%`);
                
                if (clientsData) {
                    matchedClientIds = ((clientsData as unknown) as { id: string }[]).map(c => c.id);
                }
            }

            let invQuery = supabase
                .from('invoices')
                .select('id, invoice_number, status, total_amount, subtotal, tax_amount, issue_date, currency, notes, terms, clients(name, email, phone, address, city, state, postal_code, country, gstin)')
                .eq('user_id', user!.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (searchQuery) {
                if (matchedClientIds.length > 0) {
                    invQuery = invQuery.or(`invoice_number.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%,terms.ilike.%${searchQuery}%,client_id.in.(${matchedClientIds.join(',')})`);
                } else {
                    invQuery = invQuery.or(`invoice_number.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%,terms.ilike.%${searchQuery}%`);
                }
            }

            let clientQuery = supabase
                .from('clients')
                .select('id, name, email, gstin, phone')
                .eq('user_id', user!.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (searchQuery) {
                clientQuery = clientQuery.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,gstin.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
            }

            let productQuery = supabase
                .from('products')
                .select('id, name, sku, price, category, description')
                .eq('user_id', user!.id)
                .limit(5);

            if (searchQuery) {
                productQuery = productQuery.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
            }

            let expenseQuery = supabase
                .from('expenses')
                .select('id, title, category, amount, description')
                .eq('user_id', user!.id)
                .limit(5);

            if (searchQuery) {
                expenseQuery = expenseQuery.or(`title.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
            }

            let vendorQuery = supabase
                .from('vendors')
                .select('id, name, email, gstin, phone')
                .eq('user_id', user!.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (searchQuery) {
                vendorQuery = vendorQuery.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,gstin.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
            }

            let purchaseInvoiceQuery = supabase
                .from('purchase_invoices')
                .select('id, invoice_number, status, total_amount, vendors(name)')
                .eq('user_id', user!.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (searchQuery) {
                purchaseInvoiceQuery = purchaseInvoiceQuery.or(`invoice_number.ilike.%${searchQuery}%`);
            }

            const [
                { data: invData }, 
                { data: clientData }, 
                { data: prodData }, 
                { data: expData },
                { data: vendorData },
                { data: purchaseInvData }
            ] = await Promise.all([
                invQuery,
                clientQuery,
                productQuery,
                expenseQuery,
                vendorQuery,
                purchaseInvoiceQuery
            ]);

            setInvoices((invData as unknown as SearchResult[]) || []);
            setClients((clientData as unknown as SearchResult[]) || []);
            setProducts((prodData as unknown as SearchResult[]) || []);
            setExpenses((expData as unknown as SearchResult[]) || []);
            setVendors((vendorData as unknown as SearchResult[]) || []);
            setPurchaseInvoices((purchaseInvData as unknown as SearchResult[]) || []);
        } catch (error) {
            console.error('Search fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (open && user?.id) {
                fetchData(query);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query, open, user?.id, fetchData]);

    const handleSelectInvoice = (invoice: SearchResult) => {
        setOpen(false);
        setQuery("");
        navigate(`/invoices?id=${invoice.id}`);
    };

    const handleSelectClient = (client: SearchResult) => {
        setOpen(false);
        setQuery("");
        navigate(`/clients?id=${client.id}`);
    };

    const handleSelectProduct = (product: SearchResult) => {
        setOpen(false);
        setQuery("");
        navigate(`/products?id=${product.id}`);
    };

    const handleSelectExpense = (expense: SearchResult) => {
        setOpen(false);
        setQuery("");
        navigate(`/expenses?id=${expense.id}`);
    };

    const handleSelectVendor = (vendor: SearchResult) => {
        setOpen(false);
        setQuery("");
        navigate(`/vendors?id=${vendor.id}`);
    };

    const handleSelectPurchaseInvoice = (invoice: SearchResult) => {
        setOpen(false);
        setQuery("");
        navigate(`/purchase-invoices?id=${invoice.id}`);
    };

    return (
        <div className="hidden md:block w-60 lg:w-80">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            ref={inputRef}
                            placeholder="Invoices, clients, vendors..."
                            className="pl-9 pr-10 w-full bg-background focus-visible:ring-1"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                if (!open) setOpen(true);
                            }}
                            onClick={() => setOpen(true)}
                        />
                        <kbd className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex text-muted-foreground">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </div>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0 shadow-lg"
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <Command shouldFilter={false}>
                        <CommandList className="max-h-[300px] overflow-y-auto py-2">
                            {loading && (
                                <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                                    Searching...
                                </CommandEmpty>
                            )}

                            {!loading && invoices.length === 0 && clients.length === 0 && products.length === 0 && expenses.length === 0 && vendors.length === 0 && purchaseInvoices.length === 0 && (
                                <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                                    No results found for "{query}".
                                </CommandEmpty>
                            )}

                            {!loading && invoices.length > 0 && (
                                <CommandGroup heading="Invoices">
                                    {invoices.map((inv) => (
                                        <CommandItem
                                            key={`inv-${inv.id}`}
                                            value={inv.id}
                                            onSelect={() => handleSelectInvoice(inv)}
                                            className="flex justify-between items-center cursor-pointer py-2 px-3"
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-primary shrink-0" />
                                                    <span className="font-medium">{inv.invoice_number}</span>
                                                </div>
                                                <span className="text-muted-foreground text-xs ml-6">
                                                    {inv.clients?.name || 'Unknown Client'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <span className="font-medium text-xs">₹{inv.total_amount?.toFixed(2) || '0.00'}</span>
                                                <Badge variant={inv.status === 'paid' ? 'default' : 'secondary'} className="text-[9px] px-1.5 py-0 h-4">
                                                    {inv.status}
                                                </Badge>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {!loading && clients.length > 0 && (
                                <CommandGroup heading="Clients">
                                    {clients.map((client) => (
                                        <CommandItem
                                            key={`client-${client.id}`}
                                            value={client.id}
                                            onSelect={() => handleSelectClient(client)}
                                            className="flex justify-between items-center cursor-pointer py-2 px-3"
                                        >
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-emerald-500 shrink-0" />
                                                    <span className="font-medium truncate max-w-[150px]">{client.name}</span>
                                                </div>
                                                <span className="text-muted-foreground text-[10px] pl-6 truncate max-w-[150px]">{client.email}</span>
                                            </div>
                                            <div className="flex flex-col items-end shrink-0">
                                                <span className="text-muted-foreground text-[10px]">{client.phone || 'No Phone'}</span>
                                                <span className="text-[9px] font-mono text-muted-foreground uppercase">{client.gstin || 'No GSTIN'}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {!loading && products.length > 0 && (
                                <CommandGroup heading="Products">
                                    {products.map((product) => (
                                        <CommandItem
                                            key={`prod-${product.id}`}
                                            value={product.id}
                                            onSelect={() => handleSelectProduct(product)}
                                            className="flex justify-between items-center cursor-pointer py-2 px-3"
                                        >
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-4 w-4 text-blue-500 shrink-0" />
                                                    <span className="font-medium truncate max-w-[150px]">{product.name}</span>
                                                </div>
                                                <span className="text-muted-foreground text-[10px] pl-6 truncate max-w-[150px] uppercase tracking-wider">{product.category}</span>
                                            </div>
                                            <div className="flex flex-col items-end shrink-0">
                                                <span className="text-muted-foreground text-[10px] font-mono uppercase">{product.sku || 'No SKU'}</span>
                                                <span className="font-medium text-xs">₹{product.price?.toLocaleString() || '0'}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {!loading && expenses.length > 0 && (
                                <CommandGroup heading="Expenses">
                                    {expenses.map((expense) => (
                                        <CommandItem
                                            key={`exp-${expense.id}`}
                                            value={expense.id}
                                            onSelect={() => handleSelectExpense(expense)}
                                            className="flex justify-between items-center cursor-pointer py-2 px-3"
                                        >
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="h-4 w-4 text-rose-500 shrink-0" />
                                                    <span className="font-medium truncate max-w-[150px]">{expense.title}</span>
                                                </div>
                                                <span className="text-muted-foreground text-[10px] pl-6 truncate max-w-[150px] uppercase tracking-wider">{expense.category}</span>
                                            </div>
                                            <div className="flex flex-col items-end shrink-0">
                                                <span className="font-medium text-xs text-rose-600">₹{expense.amount?.toLocaleString() || '0'}</span>
                                                <span className="text-[9px] text-muted-foreground italic">Expense</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {!loading && vendors.length > 0 && (
                                <CommandGroup heading="Vendors">
                                    {vendors.map((vendor) => (
                                        <CommandItem
                                            key={`vendor-${vendor.id}`}
                                            value={vendor.id}
                                            onSelect={() => handleSelectVendor(vendor)}
                                            className="flex justify-between items-center cursor-pointer py-2 px-3"
                                        >
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-orange-500 shrink-0" />
                                                    <span className="font-medium truncate max-w-[150px]">{vendor.name}</span>
                                                </div>
                                                <span className="text-muted-foreground text-[10px] pl-6 truncate max-w-[150px]">{vendor.email || 'No email'}</span>
                                            </div>
                                            <div className="flex flex-col items-end shrink-0">
                                                <span className="text-muted-foreground text-[10px]">{vendor.phone || 'No phone'}</span>
                                                <span className="text-[9px] font-mono text-muted-foreground uppercase">{vendor.gstin || 'No GSTIN'}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {!loading && purchaseInvoices.length > 0 && (
                                <CommandGroup heading="Purchase Bills">
                                    {purchaseInvoices.map((bill) => (
                                        <CommandItem
                                            key={`bill-${bill.id}`}
                                            value={bill.id}
                                            onSelect={() => handleSelectPurchaseInvoice(bill)}
                                            className="flex justify-between items-center cursor-pointer py-2 px-3"
                                        >
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <Receipt className="h-4 w-4 text-purple-500 shrink-0" />
                                                    <span className="font-medium truncate max-w-[150px]">{bill.invoice_number}</span>
                                                </div>
                                                <span className="text-muted-foreground text-[10px] pl-6 truncate max-w-[150px]">{bill.vendors?.name || 'Unknown Vendor'}</span>
                                            </div>
                                            <div className="flex flex-col items-end shrink-0">
                                                <span className="font-medium text-xs">₹{bill.total_amount?.toLocaleString() || '0'}</span>
                                                <Badge variant="outline" className="text-[8px] h-3 px-1">BILL</Badge>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {selectedInvoice && (
                <InvoicePreview
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    invoice={selectedInvoice as any}
                    open={previewOpen}
                    onClose={() => {
                        setPreviewOpen(false);
                        setTimeout(() => setSelectedInvoice(null), 300);
                    }}
                />
            )}
        </div>
    );
}
