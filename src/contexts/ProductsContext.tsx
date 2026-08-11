import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNotifications } from "./NotificationContext";

export interface Product {
    id: number;
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
}

const initialProducts: Product[] = [];

export interface StockMovement {
    id: string;
    productId: number;
    item: string;
    type: 'IN' | 'OUT';
    quantity: number;
    timestamp: number;
}

interface ProductsContextType {
    products: Product[];
    movements: StockMovement[];
    addProduct: (product: Product) => void;
    updateProduct: (id: number, product: Product) => void;
    deleteProduct: (id: number) => void;
    clearHistory: () => void;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
    const { addNotification } = useNotifications();

    const [products, setProducts] = useState<Product[]>(() => {
        const saved = localStorage.getItem('inventory_products');
        return saved ? JSON.parse(saved) : initialProducts;
    });

    const [movements, setMovements] = useState<StockMovement[]>(() => {
        const saved = localStorage.getItem('inventory_movements');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('inventory_products', JSON.stringify(products));
    }, [products]);

    useEffect(() => {
        localStorage.setItem('inventory_movements', JSON.stringify(movements));
    }, [movements]);

    const clearHistory = () => {
        setMovements([]);
        localStorage.removeItem('inventory_movements');
        addNotification({
            title: "History Cleared",
            message: "Stock movement history has been cleared",
            type: "info"
        });
    };

    const addMovement = (productId: number, itemName: string, type: 'IN' | 'OUT', quantity: number) => {
        const newMovement: StockMovement = {
            id: Math.random().toString(36).substr(2, 9),
            productId,
            item: itemName,
            type,
            quantity,
            timestamp: Date.now()
        };
        setMovements(prev => [newMovement, ...prev]);

        // Add notification for stock movement
        addNotification({
            title: `Stock ${type === 'IN' ? 'Increased' : 'Decreased'}`,
            message: `${itemName}: ${type === 'IN' ? '+' : '-'}${quantity} units`,
            type: type === 'IN' ? 'success' : 'info'
        });
    };

    const addProduct = (product: Product) => {
        setProducts(prev => [product, ...prev]);
        addNotification({
            title: "New Product Added",
            message: `${product.name} has been added to inventory`,
            type: "success"
        });
        if (product.quantity > 0) {
            addMovement(product.id, product.name, 'IN', product.quantity);
        }
    };

    const updateProduct = (id: number, updatedProduct: Product) => {
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
    };

    const deleteProduct = (id: number) => {
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
    };

    return (
        <ProductsContext.Provider value={{ products, movements, addProduct, updateProduct, deleteProduct, clearHistory }}>
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
