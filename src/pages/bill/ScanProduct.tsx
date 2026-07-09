import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2, Package, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ScannedProduct = {
    name: string;
    sku?: string | null;
    opening_stock?: string | number | null;
    unit?: string | null;
};

const ScanProduct = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<"idle" | "success" | "already_used" | "invalid">("idle");
    const [product, setProduct] = useState<ScannedProduct | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleScan = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // 1. Fetch token details
            const { data: tokenData, error: tokenError } = await supabase
                .from("qr_tokens")
                .select("*, products(*)")
                .eq("token", token)
                .single();

            if (tokenError || !tokenData) {
                setStatus("invalid");
                return;
            }

            setProduct(tokenData.products as ScannedProduct);

            if (tokenData.status === "used") {
                setStatus("already_used");
                return;
            }

            // 2. Mark token as used
            const { error: updateTokenError } = await supabase
                .from("qr_tokens")
                .update({ status: "used", used_at: new Date().toISOString() })
                .eq("id", tokenData.id);

            if (updateTokenError) throw updateTokenError;

            // 3. Decrement product stock
            const tokenProduct = tokenData.products as { opening_stock?: string | number | null } | null;
            const currentStock = Number(tokenProduct?.opening_stock ?? 0);
            const newStock = Math.max(0, currentStock - 1);

            const { error: updateProductError } = await supabase
                .from("products")
                .update({ opening_stock: newStock.toString() })
                .eq("id", tokenData.product_id);

            if (updateProductError) throw updateProductError;

            setProduct((prev) => (prev ? { ...prev, opening_stock: newStock.toString() } : prev));
            setStatus("success");
        } catch (err: unknown) {
            console.error("Scan error:", err);
            const maybeMessage = typeof err === "object" && err !== null ? (err as { message?: unknown }).message : null;
            setError(typeof maybeMessage === "string" ? maybeMessage : "An unexpected error occurred");
            setStatus("invalid");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            handleScan();
        } else {
            setLoading(false);
            setStatus("invalid");
        }
    }, [token, handleScan]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <div className="flex items-center space-x-2">
                        <img
                            src="/assets/images/e9085822-5bea-4642-b19e-dcfcde6248f7.png"
                            alt="ESCROWBILL"
                            className="w-10 h-10 object-contain"
                        />
                        <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                            ESCROWBILL
                        </span>
                    </div>
                </div>

                <Card className="shadow-xl border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className={cn(
                        "h-2 w-full",
                        status === "success" ? "bg-emerald-500" :
                            status === "already_used" ? "bg-amber-500" :
                                status === "invalid" ? "bg-rose-500" : "bg-slate-200"
                    )} />

                    <CardHeader className="text-center pb-2">
                        {loading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            </div>
                        ) : status === "success" ? (
                            <div className="flex justify-center py-4">
                                <div className="bg-emerald-100 p-4 rounded-full">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                                </div>
                            </div>
                        ) : status === "already_used" ? (
                            <div className="flex justify-center py-4">
                                <div className="bg-amber-100 p-4 rounded-full">
                                    <AlertCircle className="w-12 h-12 text-amber-600" />
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center py-4">
                                <div className="bg-rose-100 p-4 rounded-full">
                                    <AlertCircle className="w-12 h-12 text-rose-600" />
                                </div>
                            </div>
                        )}

                        <CardTitle className="text-2xl font-bold">
                            {loading ? "Processing Scan..." :
                                status === "success" ? "Stock Deducted!" :
                                    status === "already_used" ? "Already Scanned" : "Invalid QR Code"}
                        </CardTitle>

                        <CardDescription className="text-slate-500 dark:text-slate-400 text-lg">
                            {loading ? "Please wait while we update our records." :
                                status === "success" ? "1 unit has been removed from stock." :
                                    status === "already_used" ? "This unit was already accounted for." : "This QR code is not valid or has expired."}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6 pt-4">
                        {product && (
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <Package className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Product Details</p>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg">{product.name}</h4>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SKU / Item Code</p>
                                        <p className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">{product.sku || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Stock Level</p>
                                        <p className="font-bold text-slate-700 dark:text-slate-300">{product.opening_stock} {product.unit || "PCS"}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="pt-4">
                            <Button
                                variant="outline"
                                className="w-full h-12 font-bold text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/50"
                                onClick={() => window.location.href = "/"}
                            >
                                Go to Homepage
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <p className="mt-8 text-center text-slate-400 text-sm font-medium">
                    &copy; {new Date().getFullYear()} ESCROWBILL. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default ScanProduct;
