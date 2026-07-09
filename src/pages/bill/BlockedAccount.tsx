import { ShieldAlert, LogOut, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";

const BlockedAccount = () => {
    const { signOut } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 md:p-6">
            <SEO title="Account Blocked" />
            <div className="max-w-md w-full text-center space-y-8">
                <div className="flex justify-center">
                    <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
                        <ShieldAlert size={48} />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Account Blocked</h1>
                    <p className="text-slate-600 dark:text-slate-400 text-lg">
                        Your account has been blocked by an administrator for violation of our terms of service or non-payment.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-center space-x-3 text-slate-700 dark:text-slate-300 mb-4">
                        <Mail size={18} className="text-primary" />
                        <span className="font-medium">support@escrowbill.in</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        If you believe this is a mistake, please contact our support team.
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    <Button
                        variant="destructive"
                        className="w-full h-12 text-lg font-bold rounded-xl"
                        onClick={() => signOut()}
                    >
                        <LogOut className="mr-2 h-5 w-5" />
                        Sign Out
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full text-slate-500 dark:text-slate-400"
                        onClick={() => window.location.href = '/'}
                    >
                        Back to Homepage
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default BlockedAccount;
