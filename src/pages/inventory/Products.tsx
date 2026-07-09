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
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useProducts, Product } from "@/contexts/ProductsContext";
import * as XLSX from "xlsx";




export const Products = () => {
  const { user } = useAuth();
  const { profile, loading } = useProfile(user?.id);
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
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());

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
    return <Badge variant="default" className="bg-success text-success-foreground">In Stock</Badge>;
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
    // Validation
    if (!formData.sku || !formData.name || !formData.category || !formData.supplier ||
      !formData.cost || !formData.price || !formData.quantity || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check if SKU already exists
    if (products.some(p => p.sku.toLowerCase() === formData.sku.toLowerCase())) {
      toast.error("SKU already exists");
      return;
    }

    const newProduct: Product = {
      id: Math.max(...products.map(p => p.id)) + 1,
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

    // CSV Headers
    const headers = [
      "ID", "SKU", "Name", "Category", "Supplier",
      "Cost", "Price", "Quantity", "Location", "Status",
      "Type", "Returnable", "Tax Preference", "Description"
    ];

    // CSV Rows
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

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Create download link
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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Products{profile?.company_name ? ` - ${profile.company_name}` : ''}</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2">
            Manage your inventory products and SKUs
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2 w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      placeholder="e.g., IP15P-256"
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      placeholder="e.g., A1-B3"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Type</Label>
                  <RadioGroup
                    defaultValue="Goods"
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as 'Goods' | 'Service' }))}
                    className="flex flex-row space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Goods" id="type-goods" />
                      <Label htmlFor="type-goods" className="font-normal cursor-pointer">Goods</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Service" id="type-service" />
                      <Label htmlFor="type-service" className="font-normal cursor-pointer">Service</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>Item Policy</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="returnable"
                      checked={formData.returnableItem}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, returnableItem: checked as boolean }))}
                    />
                    <Label htmlFor="returnable" className="font-normal cursor-pointer">Returnable Item ?</Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Tax Preference</Label>
                  <RadioGroup
                    defaultValue="Taxable"
                    value={formData.taxPreference}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, taxPreference: value as 'Taxable' | 'Non-Taxable' }))}
                    className="flex flex-row space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Taxable" id="tax-taxable" />
                      <Label htmlFor="tax-taxable" className="font-normal cursor-pointer">Taxable</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Non-Taxable" id="tax-nontaxable" />
                      <Label htmlFor="tax-nontaxable" className="font-normal cursor-pointer">Non-Taxable</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., iPhone 15 Pro 256GB"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      placeholder="e.g., Electronics"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier *</Label>
                    <Input
                      id="supplier"
                      placeholder="e.g., Apple Inc."
                      value={formData.supplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost Price *</Label>
                    <Input
                      id="cost"
                      type="number"
                      placeholder="0.00"
                      value={formData.cost}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Selling Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Initial Stock *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Optional product description..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleAddProduct}>Add Product</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="glass-card">
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name or SKU..."
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
              <Button variant="outline" className="flex-1 sm:flex-none" onClick={handleExport}>Export</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
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
                  <TableHead className="min-w-[100px]">SKU</TableHead>
                  <TableHead className="min-w-[200px]">Product Name</TableHead>
                  <TableHead className="hidden xl:table-cell max-w-[300px]">Description</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead className="hidden md:table-cell">Supplier</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono font-medium text-sm">
                      {product.sku}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">{product.name}</div>
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
                      ${product.price}
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
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setViewProduct(product)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/products/edit/${product.id}`, { state: { product } })}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteProduct(product.id)}>
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
                  <p className="text-lg">${viewProduct.cost}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Price</h3>
                  <p className="text-lg">${viewProduct.price}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Stock Quantity</h3>
                  <p className="text-lg">{viewProduct.quantity}</p>
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
              <Button onClick={() => {
                setViewProduct(null);
                navigate(`/products/edit/${viewProduct.id}`, { state: { product: viewProduct } });
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