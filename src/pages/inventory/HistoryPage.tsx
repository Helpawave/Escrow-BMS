import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProducts } from "@/contexts/ProductsContext";
import { History, ArrowUpRight, ArrowDownLeft, Search, Trash2, AlertTriangle } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const HistoryPage = () => {
    const { movements, clearHistory } = useProducts();
    const [searchTerm, setSearchTerm] = useState("");
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const getTimeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";

        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";

        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";

        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";

        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";

        return Math.floor(seconds) + " seconds ago";
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    const filteredMovements = movements.filter(movement =>
        movement.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleClearLogs = () => {
        clearHistory();
        setIsConfirmOpen(false);
    };

    return (
        <div className="space-y-6 fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                        <History className="w-7 h-7 sm:w-8 sm:h-8 text-[#5644E6]" />
                        Stock History
                    </h1>
                    <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                        View and manage all stock movement and inventory transaction logs
                    </p>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search history..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="destructive"
                                className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 flex-shrink-0 cursor-pointer shadow-xs"
                                disabled={movements.length === 0}
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Clear Logs</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-md">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
                                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                                    Clear All Stock Logs?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to permanently clear all stock movement logs ({movements.length} records)? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleClearLogs}
                                    className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                                >
                                    Yes, Clear Logs
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* Transaction Log Card */}
            <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                        <CardTitle className="text-lg font-bold">Transaction Log</CardTitle>
                        <CardDescription>
                            {movements.length} total movement log entries recorded
                        </CardDescription>
                    </div>
                    {movements.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsConfirmOpen(true)}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900 gap-1.5 cursor-pointer text-xs"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Clear History Log</span>
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {filteredMovements.length > 0 ? (
                            filteredMovements.map((movement) => (
                                <div
                                    key={movement.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card hover:bg-muted/50 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors"
                                >
                                    <div className="flex items-start space-x-4 mb-3 sm:mb-0">
                                        <div className={`p-2 rounded-full ${movement.type === 'IN' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                                            }`}>
                                            {movement.type === 'IN' ? (
                                                <ArrowDownLeft className="w-5 h-5" />
                                            ) : (
                                                <ArrowUpRight className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-foreground">{movement.item}</h4>
                                            <p className="text-xs text-muted-foreground mt-1" title={formatDate(movement.timestamp)}>
                                                {getTimeAgo(movement.timestamp)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                                        <Badge
                                            variant={movement.type === "IN" ? "default" : "secondary"}
                                            className={movement.type === "IN" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                                        >
                                            {movement.type === "IN" ? "Stock In" : "Stock Out"}
                                        </Badge>
                                        <span className={`font-mono font-bold text-lg ${movement.type === 'IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                                            }`}>
                                            {movement.type === 'IN' ? '+' : '-'}{movement.quantity}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                                    <History className="w-6 h-6 text-slate-400" />
                                </div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">No history logs found</h3>
                                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                                    {searchTerm ? "Try adjusting your search terms" : "No stock movements recorded yet. New Stock In/Out entries will appear here."}
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default HistoryPage;
