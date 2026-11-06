import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Search, Check, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CountryConfig {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  maxLength: number;
  placeholder: string;
}

export const COUNTRIES: CountryConfig[] = [
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', maxLength: 10, placeholder: '98765 43210' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', maxLength: 10, placeholder: '555 123 4567' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', maxLength: 10, placeholder: '555 123 4567' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪', maxLength: 9, placeholder: '50 123 4567' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', maxLength: 9, placeholder: '50 123 4567' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', maxLength: 10, placeholder: '7911 123456' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', maxLength: 9, placeholder: '412 345 678' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦', maxLength: 8, placeholder: '3312 3456' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼', maxLength: 8, placeholder: '5123 4567' },
  { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲', maxLength: 8, placeholder: '9123 4567' },
  { code: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭', maxLength: 8, placeholder: '3612 3456' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', maxLength: 8, placeholder: '8123 4567' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', maxLength: 10, placeholder: '12 345 6789' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', maxLength: 10, placeholder: '151 1234567' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', maxLength: 9, placeholder: '6 12 34 56 78' },
  { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵', maxLength: 10, placeholder: '984 1234567' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩', maxLength: 10, placeholder: '171 2345678' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰', maxLength: 9, placeholder: '71 234 5678' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', maxLength: 9, placeholder: '21 123 456' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', maxLength: 9, placeholder: '71 123 4567' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭', maxLength: 10, placeholder: '917 123 4567' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩', maxLength: 11, placeholder: '812 3456 7890' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳', maxLength: 11, placeholder: '138 0000 0000' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', maxLength: 10, placeholder: '90 1234 5678' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰', maxLength: 10, placeholder: '300 1234567' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷', maxLength: 10, placeholder: '532 123 4567' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', maxLength: 10, placeholder: '320 123 4567' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', maxLength: 9, placeholder: '612 34 56 78' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', maxLength: 11, placeholder: '11 91234 5678' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', maxLength: 10, placeholder: '55 1234 5678' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪', maxLength: 9, placeholder: '83 123 4567' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', maxLength: 9, placeholder: '6 12345678' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭', maxLength: 9, placeholder: '78 123 45 67' }
];

export interface CountryPhoneDetails {
  country: CountryConfig;
  nationalNumber: string;
  dialCode: string;
  fullNumber: string;
  isValid: boolean;
}

export interface CountryPhoneInputProps {
  id?: string;
  name?: string;
  value?: string;
  onChange?: (value: string, details?: CountryPhoneDetails) => void;
  defaultCountry?: string; // e.g. 'IN'
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  /**
   * Whether to include the dial code in the emitted value string.
   * If true (default), emits e.g. "+91 9876543210".
   * If false, emits e.g. "9876543210".
   */
  includeDialCode?: boolean;
  /**
   * If true, shows a live digit limit badge (e.g. "10/10" or "Max: 10").
   * Defaults to true.
   */
  showLimitBadge?: boolean;
}

// Helper to parse any incoming phone string into country and national number
function parsePhone(raw: string = '', defaultCode: string = 'IN'): { country: CountryConfig; national: string } {
  const trimmed = raw.trim();
  const defaultC = COUNTRIES.find((c) => c.code === defaultCode) || COUNTRIES[0];

  if (!trimmed) {
    return { country: defaultC, national: '' };
  }

  // Check if string starts with '+'
  if (trimmed.startsWith('+')) {
    // Sort countries by dialCode length descending to match +971 before +1, etc.
    const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    for (const c of sorted) {
      if (trimmed.startsWith(c.dialCode)) {
        const remainder = trimmed.slice(c.dialCode.length).replace(/\D/g, '');
        return { country: c, national: remainder.slice(0, c.maxLength) };
      }
    }
  }

  // If no '+', check if it's already a clean digits string
  const digitsOnly = trimmed.replace(/\D/g, '');
  return {
    country: defaultC,
    national: digitsOnly.slice(0, defaultC.maxLength)
  };
}

export function CountryPhoneInput({
  id,
  name,
  value = '',
  onChange,
  defaultCountry = 'IN',
  placeholder,
  required = false,
  disabled = false,
  autoFocus = false,
  className,
  inputClassName,
  buttonClassName,
  includeDialCode = true,
  showLimitBadge = true
}: CountryPhoneInputProps) {
  // Parse initial state from incoming value
  const initial = useMemo(() => parsePhone(value, defaultCountry), []);
  const [selectedCountry, setSelectedCountry] = useState<CountryConfig>(initial.country);
  const [nationalNumber, setNationalNumber] = useState<string>(initial.national);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync internal state when external value changes
  useEffect(() => {
    const parsed = parsePhone(value, selectedCountry.code || defaultCountry);
    setSelectedCountry(parsed.country);
    setNationalNumber(parsed.national);
  }, [value, defaultCountry]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setSearchQuery('');
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input when opened
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Filter countries for dropdown search
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRIES;
    const q = searchQuery.toLowerCase().trim();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Helper to emit updated phone value to parent
  const emitChange = (country: CountryConfig, num: string) => {
    const fullNumber = num ? `${country.dialCode} ${num}` : '';
    const emittedValue = includeDialCode ? fullNumber : num;
    const details: CountryPhoneDetails = {
      country,
      nationalNumber: num,
      dialCode: country.dialCode,
      fullNumber,
      isValid: num.length === country.maxLength
    };
    onChange?.(emittedValue, details);
  };

  // Handle number input typing
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric digits
    const cleanDigits = e.target.value.replace(/\D/g, '');
    // Strictly enforce country's maximum allowed digits limit
    const limitedDigits = cleanDigits.slice(0, selectedCountry.maxLength);

    setNationalNumber(limitedDigits);
    emitChange(selectedCountry, limitedDigits);
  };

  // Handle country selection
  const handleSelectCountry = (country: CountryConfig) => {
    setSelectedCountry(country);
    setDropdownOpen(false);
    setSearchQuery('');

    // Re-slice existing number to new country's maxLength if needed
    const adjustedNumber = nationalNumber.slice(0, country.maxLength);
    setNationalNumber(adjustedNumber);
    emitChange(country, adjustedNumber);
  };

  const isComplete = nationalNumber.length === selectedCountry.maxLength;
  const hasInput = nationalNumber.length > 0;

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div
        className={cn(
          'flex items-center rounded-xl border bg-white dark:bg-slate-900 transition-all overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-600',
          disabled ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700 shadow-2xs',
          hasInput && !isComplete ? 'border-amber-300 dark:border-amber-700/80' : '',
          isComplete ? 'border-emerald-300 dark:border-emerald-700/80' : ''
        )}
      >
        {/* Country Selector Trigger */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setDropdownOpen((prev) => !prev)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0 cursor-pointer select-none',
            buttonClassName
          )}
          title={`Selected: ${selectedCountry.name} (${selectedCountry.dialCode}) - Max ${selectedCountry.maxLength} digits`}
        >
          <span className="text-base leading-none">{selectedCountry.flag}</span>
          <span className="font-mono text-xs font-bold">{selectedCountry.dialCode}</span>
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 text-slate-400 transition-transform duration-200',
              dropdownOpen && 'rotate-180'
            )}
          />
        </button>

        {/* Number Input with strict numeric filter & maxLength */}
        <div className="relative flex-1 flex items-center min-w-0">
          <input
            id={id}
            name={name}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            disabled={disabled}
            autoFocus={autoFocus}
            required={required}
            maxLength={selectedCountry.maxLength}
            value={nationalNumber}
            onChange={handleNumberChange}
            placeholder={placeholder || selectedCountry.placeholder || `${selectedCountry.maxLength}-digit number`}
            className={cn(
              'w-full py-2.5 px-3 text-sm font-semibold text-slate-900 dark:text-slate-100 bg-transparent placeholder:text-slate-400 placeholder:font-normal focus:outline-none',
              showLimitBadge ? 'pr-16' : '',
              inputClassName
            )}
          />

          {/* Dynamic Digit Counter / Max Limit Badge */}
          {showLimitBadge && (
            <div className="absolute right-2.5 flex items-center pointer-events-none select-none">
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-tight border',
                  isComplete
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : hasInput
                    ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                )}
                title={`Max limit: ${selectedCountry.maxLength} digits`}
              >
                {nationalNumber.length}/{selectedCountry.maxLength}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Country Dropdown Popover */}
      {dropdownOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 max-h-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-fade-in">
          {/* Search Header */}
          <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country or code..."
                className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Scrollable Country List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-50 dark:divide-slate-800/60 p-1">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching country found
              </div>
            ) : (
              filteredCountries.map((country) => {
                const isSelected = country.code === selectedCountry.code;
                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelectCountry(country)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer text-left',
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-base leading-none flex-shrink-0">{country.flag}</span>
                      <span className="truncate">{country.name}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                        {country.dialCode}
                      </span>
                      <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {country.maxLength}d
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default CountryPhoneInput;

