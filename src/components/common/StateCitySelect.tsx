import React, { useState, useEffect, useMemo } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  INDIAN_STATES,
  getCitiesForState,
  normalizeStateName
} from '@/data/indianStatesCities';
import { ChevronDown, MapPin } from 'lucide-react';

interface StateCitySelectProps {
  selectedState: string;
  selectedCity: string;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  stateLabel?: string;
  cityLabel?: string;
  required?: boolean;
  stateId?: string;
  cityId?: string;
  className?: string;
  disabled?: boolean;
}

export const StateCitySelect: React.FC<StateCitySelectProps> = ({
  selectedState = '',
  selectedCity = '',
  onStateChange,
  onCityChange,
  stateLabel = 'State',
  cityLabel = 'City',
  required = true,
  stateId = 'state',
  cityId = 'city',
  className = '',
  disabled = false,
}) => {
  const normalizedState = useMemo(() => normalizeStateName(selectedState), [selectedState]);
  const availableCities = useMemo(() => getCitiesForState(normalizedState), [normalizedState]);

  // Determine if the current city is custom (not in availableCities list)
  const isCustomCity = useMemo(() => {
    if (!selectedCity) return false;
    if (availableCities.length === 0) return false;
    return !availableCities.some(c => c.toLowerCase() === selectedCity.trim().toLowerCase());
  }, [selectedCity, availableCities]);

  const [showCustomCityInput, setShowCustomCityInput] = useState(false);

  useEffect(() => {
    if (isCustomCity && selectedCity) {
      setShowCustomCityInput(true);
    }
  }, [isCustomCity, selectedCity]);

  const handleStateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    onStateChange(newState);
    // If state changes, reset city unless it's already empty
    onCityChange('');
    setShowCustomCityInput(false);
  };

  const handleCitySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setShowCustomCityInput(true);
      onCityChange('');
    } else {
      setShowCustomCityInput(false);
      onCityChange(val);
    }
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
      {/* ── State Selector ── */}
      <div className="space-y-2">
        <Label htmlFor={stateId} className="flex items-center gap-1 text-xs font-bold text-foreground">
          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>{stateLabel}</span>
          {required && <span className="text-destructive font-black">*</span>}
        </Label>
        
        <div className="relative">
          <select
            id={stateId}
            value={normalizedState}
            onChange={handleStateSelect}
            disabled={disabled}
            required={required}
            className="w-full h-10 px-3 pr-8 rounded-xl border border-input bg-background text-xs sm:text-sm font-semibold text-foreground shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <option value="">Select State / UT...</option>
            {INDIAN_STATES.map((st) => (
              <option key={st} value={st} className="bg-background text-foreground py-1">
                {st}
              </option>
            ))}
            {normalizedState && !INDIAN_STATES.includes(normalizedState) && (
              <option value={normalizedState}>{normalizedState}</option>
            )}
          </select>
          <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* ── City Selector ── */}
      <div className="space-y-2">
        <Label htmlFor={cityId} className="flex items-center gap-1 text-xs font-bold text-foreground">
          <span>{cityLabel}</span>
          {required && <span className="text-destructive font-black">*</span>}
        </Label>

        <div className="space-y-2">
          <div className="relative">
            <select
              id={cityId}
              value={showCustomCityInput ? '__custom__' : selectedCity}
              onChange={handleCitySelect}
              disabled={disabled || !normalizedState}
              required={required && !showCustomCityInput}
              className="w-full h-10 px-3 pr-8 rounded-xl border border-input bg-background text-xs sm:text-sm font-semibold text-foreground shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {!normalizedState ? (
                <option value="">Select State first</option>
              ) : (
                <>
                  <option value="">Select City...</option>
                  {availableCities.map((ct) => (
                    <option key={ct} value={ct} className="bg-background text-foreground py-1">
                      {ct}
                    </option>
                  ))}
                  <option value="__custom__">✍️ Other / Enter Manually...</option>
                </>
              )}
            </select>
            <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Custom City Manual Input (appears if "Other" selected or city not in preset list) */}
          {showCustomCityInput && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
              <Input
                type="text"
                placeholder="Type city or town name..."
                value={selectedCity}
                onChange={(e) => onCityChange(e.target.value)}
                required={required}
                disabled={disabled}
                className="h-9 text-xs sm:text-sm font-medium rounded-xl"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StateCitySelect;

