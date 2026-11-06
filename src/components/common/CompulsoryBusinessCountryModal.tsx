import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTaxConfig } from '@/contexts/TaxContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { TAX_COUNTRIES, CountryTaxConfig, getCountryTaxConfig } from '@/data/taxCountries';
import { Globe, Check, ShieldCheck, ArrowRight, Loader2, Search, X, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function CompulsoryBusinessCountryModal() {
  const { user, isStaff, staffRole } = useAuth();
  const { isCountryConfigured, updateBusinessCountry, countryCode } = useTaxConfig();
  const { setCurrencyCode } = useCurrency();

  // Selected country in modal (defaults to current or India)
  const [selectedCode, setSelectedCode] = useState<string>(countryCode || 'IN');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  // If already configured or not logged in, don't show
  if (!user || isCountryConfigured) {
    return null;
  }

  // If user is a restricted staff member without admin permissions, don't block them with company-wide tax configuration
  if (isStaff && staffRole !== 'Admin') {
    return null;
  }

  const selectedCountry: CountryTaxConfig = getCountryTaxConfig(selectedCode);

  const popularCountryCodes = ['IN', 'GB', 'AE', 'SA', 'US', 'SG', 'AU', 'CA', 'DE'];
  const popularCountries = popularCountryCodes.map((c) => getCountryTaxConfig(c));
  const otherCountries = TAX_COUNTRIES.filter((c) => !popularCountryCodes.includes(c.countryCode));

  // Dynamic search filter across all countries with aliases
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return TAX_COUNTRIES.filter((c) => {
      const isAliasMatch =
        (q === 'uk' && c.countryCode === 'GB') ||
        (q === 'britain' && c.countryCode === 'GB') ||
        (q === 'england' && c.countryCode === 'GB') ||
        (q === 'usa' && c.countryCode === 'US') ||
        (q === 'america' && c.countryCode === 'US') ||
        (q === 'uae' && c.countryCode === 'AE') ||
        (q === 'dubai' && c.countryCode === 'AE') ||
        (q === 'emirates' && c.countryCode === 'AE') ||
        (q === 'ksa' && c.countryCode === 'SA') ||
        (q === 'saudi' && c.countryCode === 'SA') ||
        (q === 'india' && c.countryCode === 'IN') ||
        (q === 'bharat' && c.countryCode === 'IN');

      return (
        isAliasMatch ||
        c.countryName.toLowerCase().includes(q) ||
        c.countryCode.toLowerCase().includes(q) ||
        c.taxName.toLowerCase().includes(q) ||
        c.taxSystem.toLowerCase().includes(q) ||
        c.taxIdLabel.toLowerCase().includes(q) ||
        c.currencyCode.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      setCurrencyCode(selectedCountry.currencyCode);
      try {
        localStorage.setItem('escrow_business_country', selectedCountry.countryCode);
        localStorage.setItem('escrow_business_country_configured', 'true');
        localStorage.setItem('currency', selectedCountry.currencyCode);
        localStorage.setItem('currency_symbol', selectedCountry.currencySymbol);
      } catch {}

      await updateBusinessCountry(selectedCountry.countryCode);
      toast.success(
        `Business setup complete! Country set to ${selectedCountry.countryName} with ${selectedCountry.taxName} (${selectedCountry.currencySymbol}) setup.`
      );
      setTimeout(() => {
        window.location.reload();
      }, 400);
    } catch (err: any) {
      console.error('Error setting business country:', err);
      toast.error('Failed to save business country. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-black uppercase tracking-wider mb-1">
            <Globe className="w-3.5 h-3.5" />
            <span>Compulsory Business Setup</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
            Select Your Business Country
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Your country determines the official tax compliance system (<strong className="text-slate-700 dark:text-slate-300">GST vs. VAT</strong>), tax ID labels, and currency used across your invoices and reports.
          </p>
        </div>

        {/* Scrollable Country Selector Content */}
        <div className="overflow-y-auto flex-1 py-4 space-y-4 pr-1">
          {/* 🔍 Search Country Input */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Search Any Country (e.g. UK, USA, UAE, Germany, Nepal...)
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country by name, code, or tax (e.g. UK, UAE, Nepal, Pakistan, Germany, VAT, GST)..."
                className="w-full pl-10 pr-9 py-2.5 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/50 bg-slate-50 dark:bg-slate-800/80 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-all cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                <span>Matching Results: <strong>{searchResults.length}</strong></span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Reset to popular
                </button>
              </div>
            )}
          </div>

          {/* If Search is Active */}
          {searchQuery.trim() ? (
            <div>
              {searchResults.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Search Results ({searchResults.length})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-0.5">
                    {searchResults.map((c) => {
                      const isSelected = selectedCode === c.countryCode;
                      return (
                        <button
                          key={c.countryCode}
                          type="button"
                          onClick={() => setSelectedCode(c.countryCode)}
                          className={cn(
                            'p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group',
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20 shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-850/50'
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-black text-[10px] flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                                {c.countryCode}
                              </span>
                              <span className="text-base leading-none">{c.flag}</span>
                            </div>
                            <span
                              className={cn(
                                'text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase border',
                                c.taxSystem === 'VAT'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              )}
                            >
                              {c.taxName}
                            </span>
                          </div>

                          <div>
                            <p className="font-black text-xs text-slate-900 dark:text-white truncate">
                              {c.countryName}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400 dark:text-slate-400 mt-0.5">
                              {c.currencyCode} ({c.currencySymbol})
                            </p>
                          </div>

                          {isSelected && (
                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    No country matches "<span className="text-slate-800 dark:text-slate-200 font-bold">{searchQuery}</span>".
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCode('GLOBAL');
                      setSearchQuery('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all cursor-pointer"
                  >
                    <span>Choose International / Other (VAT)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Quick Select Grid for Major Countries */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Select Operating Country
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {popularCountries.map((c) => {
                    const isSelected = selectedCode === c.countryCode;
                    return (
                      <button
                        key={c.countryCode}
                        type="button"
                        onClick={() => setSelectedCode(c.countryCode)}
                        className={cn(
                          'p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group',
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-850/50'
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-black text-[10px] flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                              {c.countryCode}
                            </span>
                            <span className="text-base leading-none">{c.flag}</span>
                          </div>
                          <span
                            className={cn(
                              'text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase border',
                              c.taxSystem === 'VAT'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            )}
                          >
                            {c.taxName}
                          </span>
                        </div>

                        <div>
                          <p className="font-black text-xs text-slate-900 dark:text-white truncate">
                            {c.countryName}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-400 mt-0.5">
                            {c.currencyCode} ({c.currencySymbol})
                          </p>
                        </div>

                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* More Countries Dropdown */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Or Choose Any Other Country ({otherCountries.length} more)
                </label>
                <select
                  value={popularCountryCodes.includes(selectedCode) ? '' : selectedCode}
                  onChange={(e) => {
                    if (e.target.value) setSelectedCode(e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="">-- View All International Countries ({TAX_COUNTRIES.length} total) --</option>
                  {otherCountries.map((c) => (
                    <option key={c.countryCode} value={c.countryCode}>
                      {c.countryCode} - {c.countryName} ({c.taxName} • {c.currencyCode})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Dynamic Configuration Preview Card */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 border border-indigo-900/50 shadow-md space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-800/60 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center">
                  {selectedCountry.countryCode}
                </span>
                <span className="font-black text-sm">{selectedCountry.countryName} Active Setup</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                {selectedCountry.taxSystem} Active
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <p className="text-[10px] text-indigo-300 font-bold uppercase">Tax Type</p>
                <p className="font-black text-sm text-white mt-0.5">{selectedCountry.taxName}</p>
              </div>

              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <p className="text-[10px] text-indigo-300 font-bold uppercase">Tax ID Label</p>
                <p className="font-black text-xs text-white mt-0.5 truncate">{selectedCountry.taxIdLabel}</p>
              </div>

              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <p className="text-[10px] text-indigo-300 font-bold uppercase">Currency</p>
                <p className="font-black text-sm text-white mt-0.5">
                  {selectedCountry.currencyCode} ({selectedCountry.currencySymbol})
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <p className="text-[10px] text-indigo-300 font-bold uppercase">Standard Rates</p>
                <p className="font-black text-xs text-white mt-0.5 truncate">
                  {selectedCountry.taxRates.map((r) => `${r}%`).join(', ')}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-indigo-200/90 leading-relaxed">
              {selectedCountry.description}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
          <button
            type="button"
            disabled={saving}
            onClick={handleConfirm}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Configuring System Tax Setup...</span>
              </>
            ) : (
              <>
                <span>Confirm &amp; Apply {selectedCountry.taxName} ({selectedCountry.countryName}) Setup</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
export default CompulsoryBusinessCountryModal;
