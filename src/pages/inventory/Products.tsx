import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Plus, Edit, MoreHorizontal, Package, Eye, Trash2, Filter, X, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts, Product } from "@/contexts/ProductsContext";

export const Products = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { products, addProduct, deleteProduct } = useProducts();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "",
    supplier: "",
    cost: "",
    price: "",
    quantity: "",
    location: "",
    description: "",
    type: "Goods" as "Goods" | "Service",
    returnableItem: false,
    taxPreference: "Taxable" as "Taxable" | "Non-Taxable"
  });

  const [filterConfig, setFilterConfig] = useState({
    type: "all",
    status: "all",
    taxPreference: "all",
    returnable: "all"
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.hsn_code && product.hsn_code.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterConfig.type === "all" || product.type === filterConfig.type;
    const matchesStatus = filterConfig.status === "all" ||
      (filterConfig.status === "active" && product.status !== "low_stock") ||
      (filterConfig.status === "low_stock" && (product.status === "low_stock" || product.quantity < 10));
    const matchesTax = filterConfig.taxPreference === "all" || product.taxPreference === filterConfig.taxPreference;
    const matchesReturnable = filterConfig.returnable === "all" ||
      (filterConfig.returnable === "yes" && product.returnableItem) ||
      (filterConfig.returnable === "no" && !product.returnableItem);

    return matchesSearch && matchesType && matchesStatus && matchesTax && matchesReturnable;
  });

  const getStatusBadge = (status: string, quantity: number) => {
    if (status === "low_stock" || quantity < 10) {
      return <Badge variant="destructive">Low Stock</Badge>;
    }
    return <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white">In Stock</Badge>;
  };

  const resetForm = () => {
    setFormData({
      sku: "",
      name: "",
      category: "",
      supplier: "",
      cost: "",
      price: "",
      quantity: "",
      location: "",
      description: "",
      type: "Goods",
      returnableItem: false,
      taxPreference: "Taxable"
    });
  };

  const handleAddProduct = () => {
    if (!formData.sku || !formData.name || !formData.category || !formData.supplier ||
      !formData.cost || !formData.price || !formData.quantity || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (products.some(p => p.sku.toLowerCase() === formData.sku.toLowerCase())) {
      toast.error("SKU already exists");
      return;
    }

    const newProduct: Product = {
      id: Math.max(0, ...products.map(p => p.id)) + 1,
      sku: formData.sku.toUpperCase(),
      name: formData.name,
      category: formData.category,
      supplier: formData.supplier,
      cost: parseFloat(formData.cost),
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      location: formData.location.toUpperCase(),
      status: parseInt(formData.quantity) < 10 ? "low_stock" : "active",
      description: formData.description,
      type: formData.type,
      returnableItem: formData.returnableItem,
      taxPreference: formData.taxPreference
    };

    addProduct(newProduct);
    setIsDialogOpen(false);
    resetForm();
    toast.success("Product added successfully");
  };

  const handleDeleteProduct = (id: number) => {
    deleteProduct(id);
    toast.success("Product deleted successfully");
  };

  const handleExport = () => {
    if (filteredProducts.length === 0) {
      toast.error("No products to export");
      return;
    }

    const headers = [
      "ID", "SKU", "Name", "Category", "Supplier",
      "Cost", "Price", "Quantity", "Location", "Status",
      "Type", "Returnable", "Tax Preference", "Description"
    ];

    const rows = filteredProducts.map(product => [
      product.id,
      `"${product.sku}"`,
      `"${product.name}"`,
      `"${product.category}"`,
      `"${product.supplier}"`,
      product.cost,
      product.price,
      product.quantity,
      `"${product.location}"`,
      product.status,
      product.type,
      product.returnableItem ? "Yes" : "No",
      product.taxPreference,
      `"${(product.description || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `products_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Export started");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Inventory Products{profile?.company_name ? ` - ${profile.company_name}` : ''}
          </h1>
          <p className="text-muted-foreground mt-1 sm:mt-2">
            Manage your stock items, SKUs, and warehouse locations
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => navigate('/inventory/products/new')}
            className="flex items-center space-x-2 w-full sm:w-auto bg-[#5644E6] hover:bg-[#4533d5] text-white font-bold cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="glass-card">
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name, SKU, or HSN code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 sm:gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 sm:flex-none gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                    {(filterConfig.type !== "all" || filterConfig.status !== "all" || filterConfig.taxPreference !== "all" || filterConfig.returnable !== "all") && (
                      <Badge variant="secondary" className="h-5 px-1.5 ml-1">
                        {[
                          filterConfig.type !== "all",
                          filterConfig.status !== "all",
                          filterConfig.taxPreference !== "all",
                          filterConfig.returnable !== "all"
                        ].filter(Boolean).length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium leading-none">Filters</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setFilterConfig({
                          type: "all",
                          status: "all",
                          taxPreference: "all",
                          returnable: "all"
                        })}
                      >
                        Reset
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="filter-type">Type</Label>
                      <div className="flex flex-wrap gap-2">
                        {["all", "Goods", "Service"].map((type) => (
                          <Badge
                            key={type}
                            variant={filterConfig.type === type ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setFilterConfig(prev => ({ ...prev, type }))}
                          >
                            {type === "all" ? "All" : type}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="filter-status">Status</Label>
                      <div className="flex flex-wrap gap-2">
                        {["all", "active", "low_stock"].map((status) => (
                          <Badge
                            key={status}
                            variant={filterConfig.status === status ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setFilterConfig(prev => ({ ...prev, status }))}
                          >
                            {status === "all" ? "All" : status === "active" ? "Active" : "Low Stock"}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="filter-tax">Tax Preference</Label>
                      <div className="flex flex-wrap gap-2">
                        {["all", "Taxable", "Non-Taxable"].map((tax) => (
                          <Badge
                            key={tax}
                            variant={filterConfig.taxPreference === tax ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setFilterConfig(prev => ({ ...prev, taxPreference: tax }))}
                          >
                            {tax === "all" ? "All" : tax}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="filter-returnable">Returnable</Label>
                      <div className="flex flex-wrap gap-2">
                        {["all", "yes", "no"].map((val) => (
                          <Badge
                            key={val}
                            variant={filterConfig.returnable === val ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setFilterConfig(prev => ({ ...prev, returnable: val }))}
                          >
                            {val === "all" ? "All" : val === "yes" ? "Returnable" : "Non-Returnable"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button variant="outline" className="flex-1 sm:flex-none" onClick={handleExport}>
                <Download className="w-4 h-4 mr-1.5" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-[#5644E6]" />
            <span>Product Inventory</span>
          </CardTitle>
          <CardDescription>
            {filteredProducts.length} products found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">SKU / HSN</TableHead>
                  <TableHead className="min-w-[200px]">Product Name</TableHead>
                  <TableHead className="hidden xl:table-cell max-w-[300px]">Description</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead className="hidden md:table-cell">Supplier</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono font-medium text-sm">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{product.sku}</div>
                        {product.hsn_code && (
                          <div className="text-[10px] text-slate-500 font-sans font-medium">HSN: {product.hsn_code}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{product.name}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">
                          {product.category} • {product.supplier}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell max-w-[300px] truncate text-muted-foreground" title={product.description}>
                      {product.description || "-"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{product.category}</TableCell>
                    <TableCell className="hidden md:table-cell">{product.supplier}</TableCell>
                    <TableCell className="font-medium">
                      ₹{product.price}
                    </TableCell>
                    <TableCell className="font-bold">
                      {product.quantity}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(product.status, product.quantity)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setViewProduct(product)} className="cursor-pointer">
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/inventory/product/edit/${product.id}`, { state: { product } })} className="cursor-pointer">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => handleDeleteProduct(product.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Product Details Modal */}
      <Dialog open={!!viewProduct} onOpenChange={(open) => !open && setViewProduct(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {viewProduct && (
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">SKU</h3>
                  <p className="text-lg font-semibold">{viewProduct.sku}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
                  <p className="text-lg">{viewProduct.type}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                  <p className="text-lg">{viewProduct.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Category</h3>
                  <p className="text-lg">{viewProduct.category}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Supplier</h3>
                  <p className="text-lg">{viewProduct.supplier}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Cost</h3>
                  <p className="text-lg">₹{viewProduct.cost}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Price</h3>
                  <p className="text-lg">₹{viewProduct.price}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Stock Quantity</h3>
                  <p className="text-lg font-bold">{viewProduct.quantity}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                  <p className="text-lg">{viewProduct.location}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <p className="text-lg capitalize">{viewProduct.status.replace('_', ' ')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Returnable</h3>
                  <p className="text-lg">{viewProduct.returnableItem ? "Yes" : "No"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Tax Preference</h3>
                  <p className="text-lg">{viewProduct.taxPreference}</p>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p className="mt-1 text-sm">{viewProduct.description || "No description provided."}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewProduct(null)}>Close</Button>
            {viewProduct && (
              <Button className="bg-[#5644E6] hover:bg-[#4533d5] text-white" onClick={() => {
                setViewProduct(null);
                navigate(`/inventory/product/edit/${viewProduct.id}`, { state: { product: viewProduct } });
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Product
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;