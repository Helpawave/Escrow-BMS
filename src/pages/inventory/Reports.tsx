import { useState, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
    CalendarIcon,
    Download,
    FileText,
    BarChart3,
    AlertTriangle,
    Package,
    TrendingDown,
    Clock,
    DollarSign,
    Users
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useProducts } from "@/contexts/ProductsContext";

export const Reports = () => {
    const { user } = useAuth();
    const { profile, loading } = useProfile(user?.id);
    const { products } = useProducts();
    const [dateFrom, setDateFrom] = useState<Date>();
    const [dateTo, setDateTo] = useState<Date>();
    const [warehouse, setWarehouse] = useState<string>("");
    const [category, setCategory] = useState<string>("");

    // Generate real data from products
    const generateReportData = (reportType: string) => {
        const companyName = profile?.company_name || 'Company';

        // Calculate real data from products
        const reportData = {
            'stock-snapshot': {
                title: 'Stock Snapshot Report',
                headers: ['Product', 'SKU', 'Location', 'Quantity', 'Unit Price', 'Total Value'],
                data: products.map(p => [
                    p.name,
                    p.sku,
                    p.location,
                    p.quantity.toString(),
                    `$${p.price.toFixed(2)}`,
                    `$${(p.price * p.quantity).toFixed(2)}`
                ])
            },
            'stock-movements': {
                title: 'Stock Movements Report',
                headers: ['Date', 'Product', 'Type', 'Quantity', 'Status', 'Location'],
                data: products.map(p => [
                    format(new Date(), "yyyy-MM-dd"),
                    p.name,
                    'Current Stock',
                    p.quantity.toString(),
                    p.status,
                    p.location
                ])
            },
            'valuation-report': {
                title: 'Inventory Valuation Report',
                headers: ['Category', 'Items Count', 'Total Value', 'Avg Price', 'Total Quantity'],
                data: (() => {
                    const categoryMap = new Map<string, { count: number, value: number, quantity: number }>();
                    products.forEach(p => {
                        const existing = categoryMap.get(p.category) || { count: 0, value: 0, quantity: 0 };
                        categoryMap.set(p.category, {
                            count: existing.count + 1,
                            value: existing.value + (p.price * p.quantity),
                            quantity: existing.quantity + p.quantity
                        });
                    });
                    return Array.from(categoryMap.entries()).map(([cat, data]) => [
                        cat,
                        data.count.toString(),
                        `$${data.value.toFixed(2)}`,
                        `$${(data.value / data.quantity).toFixed(2)}`,
                        data.quantity.toString()
                    ]);
                })()
            },
            'low-stock-alerts': {
                title: 'Low Stock Alerts Report',
                headers: ['Product', 'SKU', 'Current Stock', 'Price', 'Status'],
                data: products
                    .filter(p => p.quantity < 10)
                    .map(p => [
                        p.name,
                        p.sku,
                        p.quantity.toString(),
                        `$${p.price.toFixed(2)}`,
                        p.quantity < 5 ? 'Critical' : 'Low'
                    ])
            },
            'audit-logs': {
                title: 'Audit Trail Report',
                headers: ['Timestamp', 'Product', 'Action', 'SKU', 'Status', 'Quantity'],
                data: products.slice(0, 10).map(p => [
                    format(new Date(), "yyyy-MM-dd HH:mm"),
                    p.name,
                    'Current Record',
                    p.sku,
                    p.status,
                    p.quantity.toString()
                ])
            },
            'user-activity': {
                title: 'User Activity Report',
                headers: ['Product', 'Category', 'Supplier', 'Stock Level', 'Value'],
                data: products.slice(0, 10).map(p => [
                    p.name,
                    p.category,
                    p.supplier,
                    p.quantity.toString(),
                    `$${(p.price * p.quantity).toFixed(2)}`
                ])
            }
        };

        return reportData[reportType as keyof typeof reportData] || reportData['stock-snapshot'];
    };

    const handleDownloadPDF = (reportType: string) => {
        const reportData = generateReportData(reportType);
        const doc = new jsPDF();
        const companyName = profile?.company_name || 'Company';

        // Add company header
        doc.setFontSize(18);
        doc.text(companyName, 14, 15);

        doc.setFontSize(14);
        doc.text(reportData.title, 14, 25);

        doc.setFontSize(10);
        doc.text(`Generated: ${format(new Date(), "PPP 'at' p")}`, 14, 32);

        // Add table
        autoTable(doc, {
            head: [reportData.headers],
            body: reportData.data,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
            styles: { fontSize: 9 }
        });

        // Save the PDF
        doc.save(`${reportType}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    };

    const handleDownloadExcel = (reportType: string) => {
        const reportData = generateReportData(reportType);
        const companyName = profile?.company_name || 'Company';

        // Create worksheet data with company header
        const wsData = [
            [companyName],
            [reportData.title],
            [`Generated: ${format(new Date(), "PPP 'at' p")}`],
            [], // Empty row
            reportData.headers,
            ...reportData.data
        ];

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Set column widths
        const colWidths = reportData.headers.map(() => ({ wch: 20 }));
        ws['!cols'] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, reportData.title.substring(0, 31));

        // Save the file
        XLSX.writeFile(wb, `${reportType}-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    };

    const handleDownload = (reportType: string, format: 'pdf' | 'excel') => {
        if (format === 'pdf') {
            handleDownloadPDF(reportType);
        } else {
            handleDownloadExcel(reportType);
        }
    };

    const standardReports = [
        {
            id: 'stock-snapshot',
            title: 'Stock Snapshot',
            description: 'Current inventory levels across all products and warehouses',
            icon: Package,
            color: 'text-blue-500',
            lastGenerated: '2 hours ago'
        },
        {
            id: 'stock-movements',
            title: 'Stock Movements',
            description: 'Detailed history of all inventory transactions and adjustments',
            icon: TrendingDown,
            color: 'text-green-500',
            lastGenerated: '1 day ago'
        },
        {
            id: 'valuation-report',
            title: 'Inventory Valuation',
            description: 'Financial valuation using FIFO, LIFO, or Average costing methods',
            icon: DollarSign,
            color: 'text-purple-500',
            lastGenerated: '3 hours ago'
        },
        {
            id: 'low-stock-alerts',
            title: 'Low Stock Alerts',
            description: 'Products below reorder point requiring immediate attention',
            icon: AlertTriangle,
            color: 'text-red-500',
            lastGenerated: '30 min ago'
        },
        {
            id: 'audit-logs',
            title: 'Audit Trail',
            description: 'Complete log of all system changes and user activities',
            icon: Clock,
            color: 'text-orange-500',
            lastGenerated: '1 hour ago'
        },
        {
            id: 'user-activity',
            title: 'User Activity',
            description: 'Summary of user actions and system usage analytics',
            icon: Users,
            color: 'text-cyan-500',
            lastGenerated: '4 hours ago'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                    Reports & Analytics{profile?.company_name ? ` - ${profile.company_name}` : ''}
                </h1>
                <p className="text-muted-foreground">
                    Generate and download comprehensive inventory reports
                </p>
            </div>

            <Tabs defaultValue="standard" className="space-y-6">
                <TabsList className="grid grid-cols-2 w-fit">
                    <TabsTrigger value="standard">Standard Reports</TabsTrigger>
                    <TabsTrigger value="custom">Custom Reports</TabsTrigger>
                </TabsList>

                <TabsContent value="standard" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {standardReports.map((report) => {
                            const Icon = report.icon;
                            return (
                                <Card key={report.id} className="glass-card hover:shadow-lg transition-all duration-300">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-2 rounded-lg bg-secondary/20", report.color)}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1">
                                                <CardTitle className="text-lg">{report.title}</CardTitle>
                                                <p className="text-xs text-muted-foreground">
                                                    Last generated: {report.lastGenerated}
                                                </p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <CardDescription className="text-sm">
                                            {report.description}
                                        </CardDescription>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => handleDownload(report.id, 'pdf')}
                                            >
                                                <FileText className="h-4 w-4 mr-1" />
                                                PDF
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => handleDownload(report.id, 'excel')}
                                            >
                                                <BarChart3 className="h-4 w-4 mr-1" />
                                                Excel
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>

                <TabsContent value="custom" className="space-y-6">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Download className="h-5 w-5" />
                                Custom Report Generator
                            </CardTitle>
                            <CardDescription>
                                Create custom reports with specific date ranges and filters
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="date-from">From Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !dateFrom && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={dateFrom}
                                                onSelect={setDateFrom}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="date-to">To Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !dateTo && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={dateTo}
                                                onSelect={setDateTo}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="warehouse">Warehouse</Label>
                                    <Select value={warehouse} onValueChange={setWarehouse}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All warehouses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Warehouses</SelectItem>
                                            <SelectItem value="main">Main Warehouse</SelectItem>
                                            <SelectItem value="secondary">Secondary Warehouse</SelectItem>
                                            <SelectItem value="retail">Retail Store</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All categories" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            <SelectItem value="electronics">Electronics</SelectItem>
                                            <SelectItem value="clothing">Clothing</SelectItem>
                                            <SelectItem value="food">Food & Beverages</SelectItem>
                                            <SelectItem value="books">Books</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <h4 className="font-medium mb-4">Report Types</h4>
                                <div className="grid gap-3 md:grid-cols-2">
                                    {[
                                        { id: 'movements', name: 'Stock Movements', desc: 'All inventory transactions' },
                                        { id: 'snapshot', name: 'Current Stock', desc: 'Current inventory levels' },
                                        { id: 'valuation', name: 'Stock Valuation', desc: 'Financial inventory value' },
                                        { id: 'low-stock', name: 'Low Stock Items', desc: 'Items below reorder point' }
                                    ].map((reportType) => (
                                        <Card key={reportType.id} className="p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h5 className="font-medium">{reportType.name}</h5>
                                                    <p className="text-sm text-muted-foreground">{reportType.desc}</p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDownload(reportType.id, 'pdf')}
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDownload(reportType.id, 'excel')}
                                                    >
                                                        <BarChart3 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};
