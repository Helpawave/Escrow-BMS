import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserLayout } from "@/components/layout/UserLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompanySetupModal } from "@/components/CompanySetupModal";
import { useAuth } from "@/contexts/AuthContext";
import { useFinance } from "@/contexts/FinanceContext";
import { useToast } from "@/hooks/use-toast";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  History,
  ArrowRight,
  Building2,
  RefreshCw,
} from "lucide-react";
import { ClientBalanceInput } from "@/components/ClientBalanceInput";
import { UplineInput } from "@/components/UplineInput";
import { BankBalanceInput } from "@/components/BankBalanceInput";
import { UparJamaInput } from "@/components/UparJamaInput";
import { ExtraExpensesInput } from "@/components/ExtraExpensesInput";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { db } from "@/lib/repository";
import type { ClientItem, BankItem, RtgsItem, ExpenseItem } from "@/lib/supabase";

export const Dashboard = () => {
  const { user } = useAuth();
  const { addEntry, getLastEntry, getUserEntries, refreshEntries } = useFinance();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [showCompanySetup, setShowCompanySetup] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Debug user state
  useEffect(() => {
    console.log('[DASHBOARD] User state changed:', {
      userId: user?.id,
      email: user?.email,
      companyName: user?.companyName,
      hasCompanyName: !!user?.companyName,
      isAllowed: user?.is_allowed
    });
  }, [user]);

  // Redirect to auth if not authenticated (SaaS uses /auth route)
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const [values, setValues] = useState({
    A: "",
    C: "",
    A1: "",
    B1: "",
    C1: "",
  });

  // Arrays for detailed tracking
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [uplines, setUplines] = useState<ClientItem[]>([]);
  const [banks, setBanks] = useState<BankItem[]>([]);
  const [rtgs, setRtgs] = useState<RtgsItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);

  // Reset trigger for explicit component clearing
  const [resetTrigger, setResetTrigger] = useState(0);

  const handleInputChange = (field: string, value: string) => {
    // Allow only numbers and negative sign
    if (value === "" || /^-?\d*$/.test(value)) {
      setValues((prev) => ({ ...prev, [field]: value }));
    }
  };

  const calculateResults = () => {
    const numValues = {
      A: parseFloat(values.A) || 0,
      C: parseFloat(values.C) || 0,
      A1: parseFloat(values.A1) || 0,
      B1: parseFloat(values.B1) || 0,
      C1: parseFloat(values.C1) || 0,
    };

    const sumX = numValues.A + numValues.C;
    const sumY = numValues.A1 + numValues.B1 + numValues.C1;
    const todayHisab = sumY - sumX;

    return { ...numValues, sumX, sumY, todayHisab };
  };

  const results = calculateResults();
  const lastEntry = user ? getLastEntry(user.id) : null;
  const previousHisab = lastEntry?.todayHisab || 0;
  const allUserEntries = user ? getUserEntries(user.id) : [];
  const sumOfAllPreviousHisab = allUserEntries.reduce(
    (sum, entry) => sum + entry.todayHisab,
    0
  );

  // Show latest history entry's difference (not current calculation difference)
  const getLatestEntryDifference = () => {
    if (!lastEntry || allUserEntries.length === 0) return 0;

    // Find the second latest entry to calculate latest entry's difference
    const sortedEntries = allUserEntries.sort((a, b) =>
      new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime()
    );

    const latestEntry = sortedEntries[0];
    const secondLatestEntry = sortedEntries[1];

    // If no second entry, first entry difference is 0
    return secondLatestEntry ? latestEntry.todayHisab - secondLatestEntry.todayHisab : 0;
  };

  const difference = getLatestEntryDifference();

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if all fields are filled
    const allFieldsFilled = Object.values(values).every(
      (value) => value !== ""
    );

    if (!allFieldsFilled) {
      toast({
        title: "Incomplete form",
        description: "Please fill in all fields before calculating",
        variant: "destructive",
      });
      return;
    }

    setShowSaveDialog(true);
  };

  const performSave = async () => {
    if (!user) return;

    const success = await addEntry({
      userId: user.id,
      ...results,
      previousHisab,
      difference,
      clients,
      uplines,
      banks,
      rtgs,
      expenses,
    });

    if (success) {
      toast({
        title: "Calculation saved!",
        description: "Your financial entry has been recorded",
      });
    }
    setShowSaveDialog(false);
  };

  const InputField = ({
    label,
    field,
  }: {
    label: string;
    field: keyof typeof values;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={field} className="text-sm font-medium">
        {label}
      </Label>
      <Input
        id={field}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="0"
        value={values[field]}
        onChange={(e) => handleInputChange(field, e.target.value)}
        className="text-right"
      />
    </div>
  );

  return (
    <UserLayout>
      <div className="space-y-3 sm:space-y-6 lg:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <img src="/logo.png" alt="Escrow Daily Hisab" className="w-10 h-10 sm:w-12 sm:h-12" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Financial Dashboard</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                <p className="text-sm sm:text-base text-muted-foreground">
                  Track your daily financial calculations
                </p>
                {user?.companyName && (
                  <>
                    <span className="hidden sm:inline text-muted-foreground">•</span>
                    <span className="text-base sm:text-lg font-semibold text-primary">
                      {user.companyName}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={refreshEntries}
              className="flex items-center gap-2"
              size="sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            {!user?.companyName && (
              <Button
                variant="outline"
                onClick={() => setShowCompanySetup(true)}
                className="flex items-center gap-2 w-full sm:w-auto"
                size="sm"
              >
                <Building2 className="w-4 h-4" />
                <span className="sm:hidden">Company</span>
                <span className="hidden sm:inline">Set Company Name</span>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Calculation Form */}
          <div className="xl:col-span-2">
            <Card className="shadow-card">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Daily Calculation
                </CardTitle>
                <CardDescription className="text-sm">
                  Enter your financial values to calculate today's hisab
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <form onSubmit={handleSaveClick} className="space-y-4 sm:space-y-6">
                  {/* First Group: Client Balance, Upline */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-primary">
                      Income Sources
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <ClientBalanceInput
                        value={values.A}
                        onChange={(value) =>
                          setValues((prev) => ({ ...prev, A: value }))
                        }
                        onEntriesChange={(entries) => setClients(entries)}
                        resetTrigger={resetTrigger}
                      />
                      <UplineInput
                        value={values.C}
                        onChange={(value) =>
                          setValues((prev) => ({ ...prev, C: value }))
                        }
                        onEntriesChange={(entries) => setUplines(entries)}
                        resetTrigger={resetTrigger}
                      />
                    </div>
                  </div>

                  {/* Second Group: Bank Balance, Upar Jama/RTGS, Extra Expenses */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-accent">
                      Expenses & Transfers
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      <BankBalanceInput
                        value={values.A1}
                        onChange={(value) =>
                          setValues((prev) => ({ ...prev, A1: value }))
                        }
                        onEntriesChange={(entries) => setBanks(entries)}
                        resetTrigger={resetTrigger}
                      />
                      <UparJamaInput
                        value={values.B1}
                        onChange={(value) =>
                          setValues((prev) => ({ ...prev, B1: value }))
                        }
                        onEntriesChange={(entries) => setRtgs(entries)}
                        resetTrigger={resetTrigger}
                      />
                      <ExtraExpensesInput
                        value={values.C1}
                        onChange={(value) =>
                          setValues((prev) => ({ ...prev, C1: value }))
                        }
                        onEntriesChange={(entries) => setExpenses(entries)}
                        resetTrigger={resetTrigger}
                      />
                    </div>
                  </div>

                  {/* Results Preview */}
                  <div className="bg-muted/50 p-3 sm:p-4 rounded-lg space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                      <span className="font-medium">Coin Report (Total Income):</span>
                      <span className="font-mono font-medium text-green-600">
                        {results.sumX}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                      <span className="font-medium">Fund Report (Total Expenses):</span>
                      <span className="font-mono font-medium text-red-600">
                        {results.sumY}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-base sm:text-lg font-semibold pt-2 border-t">
                      <span>Today's Hisab (Net Amount):</span>
                      <span
                        className={`font-mono text-lg ${results.todayHisab >= 0 ? "text-profit" : "text-loss"
                          }`}
                      >
                        {results.todayHisab}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-primary hover:opacity-90"
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate & Save
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Summary Cards */}
          <div className="space-y-3 sm:space-y-6">
            {/* Today's Hisab */}
            <Card className="shadow-card">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm font-medium">
                  Today's Hisab
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xl sm:text-2xl font-bold ${results.todayHisab >= 0 ? "text-profit" : "text-loss"
                      }`}
                  >
                    {results.todayHisab}
                  </span>
                  {results.todayHisab >= 0 ? (
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-profit" />
                  ) : (
                    <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-loss" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Previous Hisab */}
            <Card className="shadow-card">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm font-medium">
                  Previous Hisab
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 sm:space-y-2">
                  <div className="text-xl sm:text-2xl font-bold">{previousHisab}</div>
                  {lastEntry && (
                    <div className="text-xs text-muted-foreground">
                      {lastEntry.date} at {lastEntry.time}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Difference */}
            <Card className="shadow-card">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm font-medium">
                  Difference
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span
                    className={`text-xl sm:text-2xl font-bold ${difference >= 0 ? "text-profit" : "text-loss"
                      }`}
                  >
                    {difference >= 0 ? "+" : ""}
                    {difference}
                  </span>
                  <Badge variant={difference >= 0 ? "default" : "destructive"} className="w-fit">
                    {difference >= 0 ? "Profit" : "Loss"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-card">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm font-medium">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link to="/history">
                      <History className="w-4 h-4 mr-2" />
                      View History
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setShowClearDialog(true)}
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Clear All Saved Names
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <CompanySetupModal
          open={showCompanySetup}
          onClose={() => setShowCompanySetup(false)}
        />

        <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all your saved client, upline, and bank names associated with your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={async () => {
                  if (!user?.id) return;

                  try {
                    // Clear from database
                    const { error } = await db.savedNames.clearAllNames(user.id);

                    if (error) {
                      toast({
                        title: "Error",
                        description: "Failed to clear saved names",
                        variant: "destructive"
                      });
                      return;
                    }

                    // Also clear localStorage as backup
                    localStorage.removeItem('clientEntries');
                    localStorage.removeItem('uplineEntries');
                    localStorage.removeItem('bankEntries');
                    localStorage.removeItem('rtgsEntries');
                    localStorage.removeItem('expenseEntries');

                    toast({
                      title: "Names Cleared",
                      description: "All saved names have been cleared from database. Refresh page to see changes.",
                    });
                    // Optional: Reload to reflect changes immediately
                    // window.location.reload(); 
                  } catch (error) {
                    console.error('Error clearing saved names:', error);
                    toast({
                      title: "Error",
                      description: "Failed to clear saved names",
                      variant: "destructive"
                    });
                  }
                  setShowClearDialog(false);
                }}
              >
                Delete Everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Calculation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to save this calculation? This will reflect in your history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Review Again</AlertDialogCancel>
              <AlertDialogAction
                onClick={performSave}
              >
                Yes, Save Now
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </UserLayout>
  );
};
