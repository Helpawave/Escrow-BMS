import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useNotifications } from "./NotificationContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export interface Product {
    id: number | string;
    supabaseId?: string;
    sku: string;
    name: string;
    category: string;
    supplier: string;
    cost: number;
    price: number;
    quantity: number;
    location: string;
    status: string;
    description?: string;
    type: 'Goods' | 'Service';
    returnableItem: boolean;
    taxPreference: 'Taxable' | 'Non-Taxable';
    hsn_code?: string;
    barcode?: string;
    unit?: string;
    batch_number?: string;
    mfg_date?: string;
    expiry_date?: string;
    secondary_unit?: string;
    conversion_factor?: number;
    created_at?: string;
    last_moved_at?: string;
}

const initialProducts: Product[] = [];

export interface StockMovement {
    id: string;
    productId: number | string;
    item: string;
    type: 'IN' | 'OUT';
    quantity: number;
    timestamp: number;
}

interface ProductsContextType {
    products: Product[];
    movements: StockMovement[];
    addProduct: (product: Product) => void;
    updateProduct: (id: number | string, product: Product) => void;
    deleteProduct: (id: number | string) => void;
    clearHistory: () => void;
    refreshProducts: () => Promise<void>;
    isLoading: boolean;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
    const { addNotification } = useNotifications();
    const { user, profile } = useAuth();
    const targetUserId = profile?.parent_user_id || user?.id;
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [products, setProducts] = useState<Product[]>(() => {
        const saved = localStorage.getItem('inventory_products');
        return saved ? JSON.parse(saved) : initialProducts;
    });

    const [movements, setMovements] = useState<StockMovement[]>(() => {
        const saved = localStorage.getItem('inventory_movements');
        return saved ? JSON.parse(saved) : [];
    });

    // Save to local storage for quick offline / cached access
    useEffect(() => {
        localStorage.setItem('inventory_products', JSON.stringify(products));
    }, [products]);

    useEffect(() => {
        localStorage.setItem('inventory_movements', JSON.stringify(movements));
    }, [movements]);

    // Live sync from Supabase products database
    const refreshProducts = useCallback(async () => {
        if (!targetUserId) return;
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('user_id', targetUserId)
                .order('created_at', { ascending: false });

            if (!error && data) {
                const mapped: Product[] = data.map((p: any, idx: number) => {
                    const openingStock = Number(p.opening_stock || 0);
                    return {
                        id: p.id,
                        supabaseId: p.id,
                        sku: p.sku || `SKU-${String(idx + 1).padStart(4, '0')}`,
                        name: p.name || 'Untitled Product',
                        category: p.category || 'General',
                        supplier: p.supplier || 'General Supplier',
                        cost: Number(p.purchase_price || 0),
                        price: Number(p.price || 0),
                        quantity: openingStock,
                        location: p.location || 'WAREHOUSE A',
                        status: openingStock < 10 ? 'low_stock' : 'active',
                        description: p.description || '',
                        type: p.type === 'service' ? 'Service' : 'Goods',
                        returnableItem: true,
                        taxPreference: 'Taxable',
                        hsn_code: p.hsn_code || '',
                        barcode: p.barcode || '',
                        unit: p.unit || 'PCS',
                        batch_number: p.batch_number || '',
                        expiry_date: p.expiry_date || '',
                        created_at: p.created_at
                    };
                });
                setProducts(mapped);
                localStorage.setItem('inventory_products', JSON.stringify(mapped));
            }
        } catch (err) {
            console.warn("Failed to fetch products from Supabase for inventory:", err);
        } finally {
            setIsLoading(false);
        }
    }, [targetUserId]);

    // Initial load from Supabase on mount or when targetUserId changes
    useEffect(() => {
        if (targetUserId) {
            refreshProducts();
        }
    }, [targetUserId, refreshProducts]);

    const clearHistory = () => {
        setMovements([]);
        localStorage.removeItem('inventory_movements');
        addNotification({
            title: "History Cleared",
            message: "Stock movement history has been cleared",
            type: "info"
        });
    };

    const addMovement = (productId: number | string, itemName: string, type: 'IN' | 'OUT', quantity: number) => {
        const newMovement: StockMovement = {
            id: Math.random().toString(36).substr(2, 9),
            productId,
            item: itemName,
            type,
            quantity,
            timestamp: Date.now()
        };
        setMovements(prev => [newMovement, ...prev]);

        addNotification({
            title: `Stock ${type === 'IN' ? 'Increased' : 'Decreased'}`,
            message: `${itemName}: ${type === 'IN' ? '+' : '-'}${quantity} units`,
            type: type === 'IN' ? 'success' : 'info'
        });
    };

    const addProduct = async (product: Product) => {
        setProducts(prev => [product, ...prev]);
        addNotification({
            title: "New Product Added",
            message: `${product.name} has been added to inventory`,
            type: "success"
        });
        if (product.quantity > 0) {
            addMovement(product.id, product.name, 'IN', product.quantity);
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('parent_user_id').eq('id', user.id).maybeSingle();
                const targetUserId = profile?.parent_user_id || user.id;

                await supabase.from('products').insert([{
                    id: typeof product.id === 'string' && product.id.length > 20 ? product.id : crypto.randomUUID(),
                    user_id: targetUserId,
                    name: product.name,
                    sku: product.sku,
                    price: product.price,
                    purchase_price: product.cost,
                    opening_stock: product.quantity,
                    category: product.category,
                    unit: product.unit || 'PCS',
                    hsn_code: product.hsn_code || null,
                    description: product.description || ''
                }]);
            }
        } catch (err) {
            console.warn("Supabase insert error from ProductsContext:", err);
        }
    };

    const updateProduct = async (id: number | string, updatedProduct: Product) => {
        setProducts(prev => {
            const oldProduct = prev.find(p => p.id === id);
            if (oldProduct) {
                if (oldProduct.quantity !== updatedProduct.quantity) {
                    const diff = updatedProduct.quantity - oldProduct.quantity;
                    if (diff > 0) {
                        addMovement(id, updatedProduct.name, 'IN', diff);
                    } else {
                        addMovement(id, updatedProduct.name, 'OUT', Math.abs(diff));
                    }
                }

                // Check for low stock alert
                if (updatedProduct.quantity < 10 && oldProduct.quantity >= 10) {
                    addNotification({
                        title: "Low Stock Alert",
                        message: `${updatedProduct.name} is running low (${updatedProduct.quantity} units left)`,
                        type: "warning"
                    });
                }
            }
            return prev.map(p => p.id === id ? updatedProduct : p);
        });

        try {
            await supabase.from('products').update({
                name: updatedProduct.name,
                sku: updatedProduct.sku,
                price: updatedProduct.price,
                purchase_price: updatedProduct.cost,
                opening_stock: updatedProduct.quantity,
                category: updatedProduct.category,
                unit: updatedProduct.unit,
                hsn_code: updatedProduct.hsn_code,
                description: updatedProduct.description
            }).eq('id', id);
        } catch (err) {
            console.warn("Supabase product update error:", err);
        }
    };

    const deleteProduct = async (id: number | string) => {
        setProducts(prev => {
            const product = prev.find(p => p.id === id);
            if (product) {
                addNotification({
                    title: "Product Deleted",
                    message: `${product.name} has been removed from inventory`,
                    type: "info"
                });
                if (product.quantity > 0) {
                    addMovement(id, product.name, 'OUT', product.quantity);
                }
            }
            return prev.filter(p => p.id !== id);
        });

        try {
            await supabase.from('products').delete().eq('id', id);
        } catch (err) {
            console.warn("Supabase product delete error:", err);
        }
    };

    return (
        <ProductsContext.Provider value={{ products, movements, addProduct, updateProduct, deleteProduct, clearHistory, refreshProducts, isLoading }}>
            {children}
        </ProductsContext.Provider>
    );
};

export const useProducts = () => {
    const context = useContext(ProductsContext);
    if (!context) {
        throw new Error("useProducts must be used within ProductsProvider");
    }
    return context;
};
