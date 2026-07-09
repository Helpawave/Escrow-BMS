import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit } from "lucide-react";

export const ProductDetails = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const product = location.state?.product;

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

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/products")}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Product Details</h1>
                <Button onClick={() => navigate(`/products/edit/${id}`, { state: { product } })} className="ml-auto">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Product
                </Button>
            </div>

            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground">SKU</h3>
                            <p className="text-lg font-semibold">{product.sku}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                            <p className="text-lg">{product.name}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Category</h3>
                            <p className="text-lg">{product.category}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Supplier</h3>
                            <p className="text-lg">{product.supplier}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Price</h3>
                            <p className="text-lg">${product.price}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Stock Quantity</h3>
                            <p className="text-lg">{product.quantity}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                            <p className="text-lg">{product.location}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                            <p className="text-lg capitalize">{product.status.replace('_', ' ')}</p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                        <p className="mt-1 text-sm">{product.description || "No description provided."}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
