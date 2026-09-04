import { useState, useEffect } from "react";
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
  DialogDescription,
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
import { Search, Plus, Edit, MoreHorizontal, Package, Eye, Trash2, Filter, X, Download, Tag, Calendar, AlertTriangle, Printer, RefreshCw, Loader2, ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts, Product } from "@/contexts/ProductsContext";
import { BarcodeStickerModal, BarcodeProductInfo } from "@/components/inventory/BarcodeStickerModal";

export const Products = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { products, addProduct, deleteProduct, refreshProducts, isLoading } = useProducts();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [stickerModalProduct, setStickerModalProduct] = useState<BarcodeProductInfo | null>(null);

  // Low Stock 1-Click Purchase Reorder Modal state
  const [reorderProduct, setReorderProduct] = useState<Product | null>(null);
  const [reorderQuantity, setReorderQuantity] = useState<number>(10);
  const [reorderCost, setReorderCost] = useState<string>("");
  const [reorderSupplier, setReorderSupplier] = useState<string>("");

  const handleOpenReorder = (product: Product) => {
    setReorderProduct(product);
    setReorderQuantity(10);
    setReorderCost(product.cost ? String(product.cost) : (product.price ? String(product.price) : "0"));
    setReorderSupplier(product.supplier || "");
  };

  const handleConfirmReorder = () => {
    if (!reorderProduct) return;
    const qty = Number(reorderQuantity) || 1;
    const rate = Number(reorderCost) || 0;

    navigate('/billing/create-invoice?type=purchase', {
      state: {
        prefillProduct: {
          id: String(reorderProduct.id),
          name: reorderProduct.name,
          sku: reorderProduct.sku,
          unit: reorderProduct.unit || 'pcs',
          rate: rate,
          quantity: qty,
          supplier: reorderSupplier
        }
      }
    });
    setReorderProduct(null);
  };

  // Sync products on mount
  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

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
      (filterConfig.status === "low_stock" && (product.status === "low_stock" || product.quantity <= 5 || product.quantity < 10));
    const matchesTax = filterConfig.taxPreference === "all" || product.taxPreference === filterConfig.taxPreference;
    const matchesReturnable = filterConfig.returnable === "all" ||
      (filterConfig.returnable === "yes" && product.returnableItem) ||
      (filterConfig.returnable === "no" && !product.returnableItem);

    return matchesSearch && matchesType && matchesStatus && matchesTax && matchesReturnable;
  });

  const getStatusBadge = (product: Product) => {
    const isCriticalLow = product.quantity <= 5;
    const isLow = product.status === "low_stock" || product.quantity < 10;

    if (isCriticalLow) {
      return (
        <div className="flex flex-col gap-1.5 items-start">
          <Badge variant="destructive" className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 shadow-xs">
            <AlertTriangle className="w-3 h-3 animate-pulse" />
            Low Stock ({product.quantity} left)
          </Badge>
          <Button
            size="sm"
            type="button"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenReorder(product);
            }}
            className="h-6 text-[10px] px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 font-extrabold flex items-center gap-1 shadow-xs cursor-pointer rounded-md transition-all hover:scale-105"
            title="Create Purchase Bill in 1-Click to reorder this stock"
          >
            <ShoppingCart className="w-3 h-3 text-amber-700 dark:text-amber-400" />
            1-Click Purchase
          </Button>
        </div>
      );
    }

    if (isLow) {
      return (
        <div className="flex flex-col gap-1.5 items-start">
          <Badge variant="destructive" className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] px-2 py-0.5">
            Low Stock ({product.quantity})
          </Badge>
          <Button
            size="sm"
            type="button"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenReorder(product);
            }}
            className="h-5 text-[10px] px-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold flex items-center gap-1 cursor-pointer"
          >
            <ShoppingCart className="w-2.5 h-2.5" />
            Reorder
          </Button>
        </div>
      );
    }

    return <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px]">In Stock</Badge>;
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

    const numIds = products.filter(p => typeof p.id === 'number').map(p => p.id as number);
    const newProduct: Product = {
      id: (numIds.length > 0 ? Math.max(0, ...numIds) : 0) + 1,
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

  const handleDeleteProduct = (id: number | string) => {
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

  const getExpiryBadge = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const now = new Date();
    const exp = new Date(expiryDate);
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <Badge variant="destructive" className="text-[9px] font-black px-1.5 py-0.5 whitespace-nowrap">
          Expired ({expiryDate})
        </Badge>
      );
    }
    if (diffDays <= 30) {
      return (
        <Badge className="text-[9px] font-black px-1.5 py-0.5 bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 whitespace-nowrap">
          Expires in {diffDays}d
        </Badge>
      );
    }
    return (
      <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
        EXP: {expiryDate}
      </span>
    );
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
            variant="outline"
            onClick={() => {
              refreshProducts();
              toast.info("Syncing inventory with database...");
            }}
            disabled={isLoading}
            className="flex items-center space-x-2 w-full sm:w-auto cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#5644E6]' : ''}`} />
            <span>Sync Live</span>
          </Button>
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
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 sm:flex-none">
                    <Filter className="w-4 h-4 mr-1.5" />
                    Filters
                    {[
                      filterConfig.type !== "all",
                      filterConfig.status !== "all",
                      filterConfig.taxPreference !== "all",
                      filterConfig.returnable !== "all"
                    ].filter(Boolean).length > 0 && (
                      <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
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
            {isLoading ? "Fetching products from database..." : `${filteredProducts.length} products found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">SKU / HSN</TableHead>
                  <TableHead className="min-w-[200px]">Product Name</TableHead>
                  <TableHead className="hidden lg:table-cell">Batch & Expiry</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead className="hidden md:table-cell">Supplier</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock / Units</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-[#5644E6]" />
                        <span className="text-sm text-muted-foreground font-medium">Loading products from database...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Package className="w-10 h-10 text-muted-foreground/50" />
                        <div className="text-sm font-medium text-muted-foreground">
                          {searchTerm ? "No products match your search criteria." : "No products found in inventory."}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => navigate('/inventory/products/new')}
                          className="bg-[#5644E6] text-white hover:bg-[#4533d5]"
                        >
                          <Plus className="w-4 h-4 mr-1.5" />
                          Add First Product
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                  const hasSecondaryUnit = product.secondary_unit && product.conversion_factor && product.conversion_factor > 0;
                  const secondaryQuantity = hasSecondaryUnit ? (product.quantity / (product.conversion_factor || 1)).toFixed(1) : null;

                  return (
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
                          {/* Mobile batch badge */}
                          {(product.batch_number || product.expiry_date) && (
                            <div className="flex items-center gap-1.5 mt-1 lg:hidden">
                              {product.batch_number && (
                                <span className="font-mono text-[9px] px-1 bg-slate-100 dark:bg-slate-800 rounded">
                                  B:{product.batch_number}
                                </span>
                              )}
                              {getExpiryBadge(product.expiry_date)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="space-y-1">
                          {product.batch_number && (
                            <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                              B: {product.batch_number}
                            </div>
                          )}
                          {getExpiryBadge(product.expiry_date) || (
                            <span className="text-[11px] text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{product.category}</TableCell>
                      <TableCell className="hidden md:table-cell">{product.supplier}</TableCell>
                      <TableCell className="font-medium">
                        ₹{product.price}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <span className="font-bold text-foreground">
                            {product.quantity} <span className="text-xs font-normal text-muted-foreground">{product.unit || 'pcs'}</span>
                          </span>
                          {hasSecondaryUnit && (
                            <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                              ≈ {secondaryQuantity} {product.secondary_unit}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(product)}
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
                            <DropdownMenuItem
                              onClick={() => handleOpenReorder(product)}
                              className="cursor-pointer text-amber-700 dark:text-amber-400 font-bold"
                            >
                              <ShoppingCart className="w-4 h-4 mr-2 text-amber-600" />
                              1-Click Purchase Bill
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setStickerModalProduct({
                                name: product.name,
                                sku: product.sku,
                                barcode: product.barcode,
                                price: product.price,
                                batch_number: product.batch_number,
                                expiry_date: product.expiry_date,
                                companyName: profile?.company_name
                              })}
                              className="cursor-pointer"
                            >
                              <Printer className="w-4 h-4 mr-2 text-indigo-600" />
                              Print Barcode Stickers
                            </DropdownMenuItem>
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
                  );
                })
              )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Barcode / Price Sticker Modal */}
      <BarcodeStickerModal
        open={!!stickerModalProduct}
        onOpenChange={(open) => !open && setStickerModalProduct(null)}
        product={stickerModalProduct}
      />

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

      {/* 1-Click Purchase Bill Modal for Low Stock Reorder */}
      <Dialog open={!!reorderProduct} onOpenChange={(open) => !open && setReorderProduct(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-foreground">
                  Create Purchase Bill for Low Stock
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Replenish stock for this item in 1 click.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {reorderProduct && (
            <div className="space-y-4 py-2">
              {/* Product Details Header Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-foreground text-sm leading-tight">{reorderProduct.name}</h4>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">SKU: {reorderProduct.sku}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Current Stock</span>
                  <Badge variant="destructive" className="bg-rose-600 text-white font-mono font-bold text-xs mt-0.5">
                    {reorderProduct.quantity} {reorderProduct.unit || 'pcs'} left
                  </Badge>
                </div>
              </div>

              {/* Purchase Quantity to Order */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground">
                    Purchase Quantity to Order (कितना stock मंगाना है?)
                  </Label>
                  <span className="text-[11px] font-semibold text-muted-foreground">Unit: {reorderProduct.unit || 'pcs'}</span>
                </div>
                <Input
                  type="number"
                  min="1"
                  value={reorderQuantity}
                  onChange={(e) => setReorderQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="font-bold text-lg h-11"
                  placeholder="Enter quantity to purchase"
                />
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Quick Add:</span>
                  {[5, 10, 25, 50, 100].map(qty => (
                    <Button
                      key={qty}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setReorderQuantity(qty)}
                      className={`h-7 px-2.5 text-xs font-bold rounded-lg cursor-pointer ${reorderQuantity === qty ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 hover:bg-slate-100'}`}
                    >
                      +{qty}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Purchase Cost & Supplier */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Purchase Cost per Unit (₹)</Label>
                  <Input
                    type="number"
                    value={reorderCost}
                    onChange={(e) => setReorderCost(e.target.value)}
                    className="font-semibold text-sm"
                    placeholder="Rate per item"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Supplier / Vendor</Label>
                  <Input
                    value={reorderSupplier}
                    onChange={(e) => setReorderSupplier(e.target.value)}
                    className="font-semibold text-sm"
                    placeholder="Vendor name"
                  />
                </div>
              </div>

              {/* Total Purchase Summary */}
              <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-300">Total Estimated Purchase Value</p>
                  <p className="text-[11px] text-muted-foreground">{reorderQuantity} {reorderProduct.unit || 'pcs'} × ₹{Number(reorderCost) || 0}</p>
                </div>
                <div className="text-right font-black text-lg text-indigo-600 dark:text-indigo-400 font-mono">
                  ₹{(reorderQuantity * (Number(reorderCost) || 0)).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReorderProduct(null)}
              className="rounded-xl font-semibold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmReorder}
              className="bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 text-white rounded-xl font-bold px-5 shadow-lg shadow-indigo-500/20 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Generate Purchase Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;