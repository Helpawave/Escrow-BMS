import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/contexts/ProductsContext";
import { History, ArrowUpRight, ArrowDownLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export const HistoryPage = () => {
    const { movements } = useProducts();
    const [searchTerm, setSearchTerm] = useState("");

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

    return (
        <div className="space-y-8 fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                        <History className="w-8 h-8" />
                        History
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        View all stock movements and inventory adjustments
                    </p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search history..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Transaction Log</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredMovements.length > 0 ? (
                            filteredMovements.map((movement) => (
                                <div
                                    key={movement.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card hover:bg-muted/50 rounded-lg border transition-colors"
                                >
                                    <div className="flex items-start space-x-4 mb-3 sm:mb-0">
                                        <div className={`p-2 rounded-full ${movement.type === 'IN' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
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
                                            className={movement.type === "IN" ? "bg-success hover:bg-success/90" : ""}
                                        >
                                            {movement.type === "IN" ? "Stock In" : "Stock Out"}
                                        </Badge>
                                        <span className={`font-mono font-bold text-lg ${movement.type === 'IN' ? 'text-success' : 'text-foreground'
                                            }`}>
                                            {movement.type === 'IN' ? '+' : '-'}{movement.quantity}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                                    <History className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium">No history found</h3>
                                <p className="text-muted-foreground">
                                    {searchTerm ? "Try adjusting your search terms" : "No stock movements recorded yet"}
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
