import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { useProducts } from "@/contexts/ProductsContext";

const categories = ["Electronics", "Computers", "Accessories", "Mobile", "Tablets"];
const suppliers = ["Apple Inc.", "Samsung", "Microsoft", "Dell", "HP", "Lenovo"];

export const EditProduct = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { updateProduct } = useProducts();
    const product = location.state?.product;

    const [formData, setFormData] = useState(product || {
        sku: "",
        name: "",
        category: "",
        supplier: "",
        cost: "",
        price: "",
        quantity: "",
        location: "",
        description: ""
    });

    if (!product) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold">Product not found</h1>
                <Button onClick={() => navigate("/products")} className="mt-4">
                    Back to Products
                </Button>
            </div>
        );
    }

    const handleSave = () => {
        const updatedProduct = {
            ...product,
            sku: formData.sku,
            name: formData.name,
            category: formData.category,
            supplier: formData.supplier,
            cost: typeof formData.cost === 'string' ? parseFloat(formData.cost) : formData.cost,
            price: typeof formData.price === 'string' ? parseFloat(formData.price) : formData.price,
            quantity: typeof formData.quantity === 'string' ? parseInt(formData.quantity) : formData.quantity,
            location: formData.location,
            status: (typeof formData.quantity === 'string' ? parseInt(formData.quantity) : formData.quantity) < 10 ? "low_stock" : "active",
            description: formData.description
        };

        updateProduct(product.id, updatedProduct);
        toast.success("Product updated successfully");
        navigate("/products");
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/products")}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
            </div>

            <Card className="glass-card max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Edit Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="sku">SKU</Label>
                            <Input
                                id="sku"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Product Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="supplier">Supplier</Label>
                            <Select
                                value={formData.supplier}
                                onValueChange={(value) => setFormData({ ...formData, supplier: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select supplier" />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map((sup) => (
                                        <SelectItem key={sup} value={sup}>{sup}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cost">Cost</Label>
                            <Input
                                id="cost"
                                type="number"
                                value={formData.cost}
                                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price">Price</Label>
                            <Input
                                id="price"
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input
                                id="quantity"
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => navigate("/products")}>Cancel</Button>
                        <Button onClick={handleSave}>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
