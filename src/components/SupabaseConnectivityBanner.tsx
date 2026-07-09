import { AlertTriangle, WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

export function SupabaseConnectivityBanner() {
    const { isSupabaseConnected } = useAuth();

    // Don't show anything if connected or still checking (null)
    if (isSupabaseConnected !== false) {
        return null;
    }

    return (
        <div className="sticky top-0 z-[100] w-full px-4 py-3 bg-destructive/10 border-b border-destructive/20 animate-in fade-in slide-in-from-top-4 duration-500">
            <Alert variant="destructive" className="max-w-7xl mx-auto bg-destructive/5 border-none p-0 shadow-none">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-destructive/10 rounded-full shrink-0">
                        <WifiOff className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="flex-1">
                        <AlertTitle className="text-destructive font-bold flex items-center gap-2">
                            Database Connection Error
                        </AlertTitle>
                        <AlertDescription className="text-destructive/80 text-sm mt-1 leading-relaxed">
                            Aapke device ya network se database connect nahi ho pa raha hai. Yeh aksar **Gujarat ya regional ISP (Jio/Local)** ke network blocks ki wajah se hota hai.
                            <div className="mt-3 flex flex-col gap-2">
                                <div className="flex items-start gap-2">
                                    <span className="font-bold shrink-0">•</span>
                                    <p>Mobile data (hotspot) use karke dekhein (kabhi-kabhi WiFi blocks hote hain).</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="font-bold shrink-0">•</span>
                                    <p>Apne browser ya device mein <strong>Google DNS (8.8.8.8)</strong> ya Cloudflare DNS set karein.</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="font-bold shrink-0">•</span>
                                    <p>Check karein agar office/school firewall Supabase domains ko block toh nahi kar rahi.</p>
                                </div>
                            </div>
                        </AlertDescription>
                    </div>
                    <div className="hidden sm:block shrink-0">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-3 py-1.5 bg-destructive text-destructive-foreground text-xs font-medium rounded-md hover:bg-destructive/90 transition-colors shadow-sm"
                        >
                            Retry Connection
                        </button>
                    </div>
                </div>
            </Alert>
        </div>
    );
}
