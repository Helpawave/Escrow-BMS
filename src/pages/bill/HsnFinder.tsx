import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Copy, Check, ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SEO } from "@/components/SEO";
import Footer from "@/components/Footer";

interface HsnItem {
  code: string;
  description: string;
}

const HsnFinder = () => {
  const [data, setData] = useState<HsnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 30;

  useEffect(() => {
    // Lazy load the large dataset
    import("@/data/hsnCodes.json")
      .then((module) => {
        setData(module.default as HsnItem[]);
      })
      .catch((err) => {
        console.error("Failed to load HSN codes:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) {
      return data.slice(0, 100);
    }
    const term = searchTerm.toLowerCase().trim();
    return data.filter(
      (item) =>
        item.code.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const displayedItems = filteredData.slice(0, page * itemsPerPage);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <SEO
        title="Free HSN & SAC Code Finder | GST Rates & Codes Search"
        description="Search official GST HSN codes for goods and SAC codes for services. Instant, free code lookup for Indian GST billing and invoicing."
        keywords="hsn code finder, sac code list, gst hsn search, goods service tax codes india"
      />

      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <img
                src="/assets/images/e9085822-5bea-4642-b19e-dcfcde6248f7.png"
                alt="ESCROWBILL Logo"
                className="w-8 h-8 object-contain"
              />
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                ESCROW<span className="text-emerald-600 dark:text-emerald-400">BILL</span>
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="outline" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-10 max-w-5xl">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Home
          </Link>
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Official GST Directory</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground mb-3">
            HSN &amp; SAC <span className="text-emerald-500">Code Finder</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Quickly search over 10,000+ official GST Harmonized System Nomenclature (HSN) and Service Accounting Codes (SAC) for accurate invoicing.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8 max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search by product name (e.g., cotton, software, rice) or HSN code (e.g., 9983, 5208)..."
            className="pl-12 pr-4 h-14 text-base rounded-2xl bg-muted/30 border border-border shadow-xs focus-visible:ring-2 focus-visible:ring-emerald-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status / Count */}
        <div className="flex justify-between items-center text-xs text-muted-foreground mb-4 px-1">
          <span>
            {loading
              ? "Loading directory..."
              : `Found ${filteredData.length.toLocaleString()} codes`}
          </span>
          {searchTerm && <span>Filtered by: "{searchTerm}"</span>}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-sm">Loading official HSN &amp; SAC catalog...</p>
          </div>
        ) : displayedItems.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-border bg-muted/10">
            <p className="text-base font-semibold text-foreground mb-1">No matching codes found</p>
            <p className="text-xs text-muted-foreground">
              Try searching with broader keywords like "service", "cloth", "steel", or 2-digit chapter numbers.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {displayedItems.map((item, idx) => (
              <Card
                key={`${item.code}-${idx}`}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-500/40 transition-colors bg-card/60 backdrop-blur-xs"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                      {item.code}
                    </span>
                    <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
                      {item.code.startsWith("99") ? "SAC Code (Service)" : "HSN Code (Goods)"}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed pt-0.5">
                    {item.description}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(item.code)}
                  className="shrink-0 rounded-xl h-9 text-xs font-semibold gap-1.5 self-start sm:self-center"
                >
                  {copiedCode === item.code ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </Button>
              </Card>
            ))}

            {displayedItems.length < filteredData.length && (
              <div className="pt-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl px-6 font-semibold text-xs"
                >
                  Load More Results ({filteredData.length - displayedItems.length} remaining)
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default HsnFinder;
