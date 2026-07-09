import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/repository';

interface ClientEntry {
  id: string;
  name: string;
  balance: string;
  isEditingName: boolean;
}

interface ClientBalanceInputProps {
  value: string;
  onChange: (value: string) => void;
  onEntriesChange?: (entries: { name: string, value: number }[]) => void;
  resetTrigger?: number;
}

export const ClientBalanceInput = ({ value, onChange, onEntriesChange, resetTrigger }: ClientBalanceInputProps) => {
  const { user } = useAuth();

  const [entries, setEntries] = useState<ClientEntry[]>([
    { id: '1', name: '', balance: '0', isEditingName: true }
  ]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [directValue, setDirectValue] = useState(value);
  const [isLoading, setIsLoading] = useState(true);
  const [allSavedNames, setAllSavedNames] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<{ [key: string]: boolean }>({});
  const [filteredSuggestions, setFilteredSuggestions] = useState<{ [key: string]: string[] }>({});

  // Load saved names from database when component mounts or user changes
  useEffect(() => {
    const loadSavedNames = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // console.log('[CLIENT_INPUT] Loading names from database for user:', user.id);
        const { data, error } = await db.savedNames.getSavedNames(user.id, 'clients');

        if (error) {
          // console.error('[CLIENT_INPUT] Error loading saved client names:', error);
          setIsLoading(false);
          return;
        }

        if (data && data.length > 0) {
          // console.log('[CLIENT_INPUT] Loaded saved names:', data);

          // Collect all unique names for suggestions
          const uniqueNames = Array.from(new Set<string>(
            data.map((entry: { name?: string }) => entry.name).filter((name): name is string => !!name && name.trim() !== '')
          ));
          // console.log('[CLIENT_INPUT] Extracted unique names:', uniqueNames);
          setAllSavedNames(uniqueNames);

          // Restore names AND balances
          const restoredEntries = data.map((entry: any, index: number) => ({
            id: entry.id || (index + 1).toString(),
            name: entry.name || '',
            balance: entry.balance || '0',
            isEditingName: entry.isEditingName !== undefined ? entry.isEditingName : (entry.name === '')
          }));

          // console.log('[CLIENT_INPUT] Restored entries:', restoredEntries);
          setEntries(restoredEntries);
          setIsExpanded(true); // Auto-expand if names exist
          // console.log('[CLIENT_INPUT] Names restored from database');
        } else {
          // console.log('[CLIENT_INPUT] No saved names found in database');
        }
      } catch (error) {
        // console.error('Error loading saved names:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedNames();
  }, [user?.id]);

  // Save entries to database whenever names change
  useEffect(() => {
    const saveToDatabase = async () => {
      if (!user?.id || isLoading) return;

      try {
        // console.log('[CLIENT_INPUT] Saving to database:', entries);
        // Only save if there are meaningful entries with names
        const hasNames = entries.some(entry => entry.name.trim() !== '');

        if (hasNames) {
          // Save the structure with names AND balances
          const namesToSave = entries
            .filter(entry => entry.name.trim() !== '')
            .map(entry => ({
              id: entry.id,
              name: entry.name,
              balance: entry.balance,
              isEditingName: entry.isEditingName
            }));

          const { error } = await db.savedNames.saveNames(user.id, 'clients', namesToSave);

          if (error) {
            // console.error('Error saving client names to database:', error);
          } else {
            // console.log('[CLIENT_INPUT] Names saved to database successfully');

            // Update suggestions list with new names
            const uniqueNames = [...new Set(entries.map(entry => entry.name).filter(name => name && name.trim() !== ''))];
            setAllSavedNames(uniqueNames);
            // console.log('[CLIENT_INPUT] Updated suggestions list:', uniqueNames);
          }
        }
      } catch (error) {
        // console.error('Error saving client names:', error);
      }
    };

    // Debounce the save operation to avoid too many database calls
    const timeoutId = setTimeout(saveToDatabase, 1000);
    return () => clearTimeout(timeoutId);
  }, [entries, user?.id, isLoading]);

  // Track if this is the initial load to avoid interfering with name restoration
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  // Reset component when parent explicitly clears (not on initial load)
  useEffect(() => {
    // Only allow reset after initial load is complete and names are loaded
    if (!isLoading && !hasInitiallyLoaded) {
      setHasInitiallyLoaded(true);
      return;
    }

    if (value === "" && directValue !== "" && !isLoading && hasInitiallyLoaded) {
      // console.log('[CLIENT_INPUT] Parent triggered reset - value:', value, 'directValue:', directValue);
      // Only reset if we don't have saved names or if this is an explicit form reset
      const hasExistingNames = entries.some(entry => entry.name.trim() !== '');
      if (!hasExistingNames) {
        setEntries([{ id: '1', name: '', balance: '', isEditingName: true }]);
        setDirectValue("");
        setIsExpanded(false);
      } else {
        // If we have names, just clear the direct value but keep entries
        setDirectValue("");
      }
    } else if (value !== directValue && value !== "") {
      setDirectValue(value);
    }
  }, [value, isLoading, hasInitiallyLoaded, entries]);

  // Reset component when resetTrigger changes - preserve names, clear only amounts
  useEffect(() => {
    if (resetTrigger && resetTrigger > 0) {
      // Preserve names, clear only balances
      setEntries(prev => prev.map(entry => ({
        ...entry,
        balance: '0'
        // Keep isEditingName as it was - don't change edit mode
      })));

      setDirectValue("");

      // Update parent with preserved names but zero values
      setEntries(prev => {
        const hasNames = prev.some(entry => entry.name.trim() !== '');
        if (!hasNames) {
          setIsExpanded(false);
        }
        return prev;
      });
    }
  }, [resetTrigger]);

  // Calculate total when expanded, use direct value when collapsed
  useEffect(() => {
    if (isExpanded) {
      const total = entries.reduce((sum, entry) => {
        const balance = parseFloat(entry.balance) || 0;
        return sum + balance;
      }, 0);
      onChange(total.toString());

      // Send entries to parent for saving
      const validEntries = entries
        .filter(entry => entry.name && entry.balance)
        .map(entry => ({ name: entry.name, value: parseFloat(entry.balance) || 0 }));
      onEntriesChange?.(validEntries);
    } else {
      onChange(directValue);
      onEntriesChange?.([]);
    }
  }, [entries, directValue, isExpanded, onChange, onEntriesChange]);

  const handleDirectValueChange = (newValue: string) => {
    // Allow only numbers and negative sign
    if (newValue === '' || /^-?\d*\.?\d*$/.test(newValue)) {
      // Only allow editing when collapsed
      if (!isExpanded) {
        setDirectValue(newValue);
      }
    }
  };

  const handleExpandToggle = () => {
    if (!isExpanded) {
      // When expanding, check if we have saved entries with names
      const hasExistingNames = entries.some(entry => entry.name.trim() !== '');
      if (!hasExistingNames && directValue) {
        // Only create new entry if no existing names and there's a direct value
        setEntries([{ id: '1', name: '', balance: directValue, isEditingName: true }]);
      }
      // If we have existing names, keep them as is
    } else {
      // When collapsing, save current total as direct value
      const total = entries.reduce((sum, entry) => {
        const balance = parseFloat(entry.balance) || 0;
        return sum + balance;
      }, 0);
      setDirectValue(total.toString());
      // Don't reset entries - keep names preserved
    }
    setIsExpanded(!isExpanded);
  };

  const addEntry = () => {
    const newEntry: ClientEntry = {
      id: Date.now().toString(),
      name: '',
      balance: '0',
      isEditingName: true
    };
    setEntries([...entries, newEntry]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter(entry => entry.id !== id));
    } else {
      // If only one entry, clear it, keep one empty entry, and collapse
      setEntries([{ id: '1', name: '', balance: '0', isEditingName: true }]);
      setIsExpanded(false); // Collapse the section
      setDirectValue('0'); // Clear direct value too
    }
  };

  const updateEntry = (id: string, field: keyof ClientEntry, value: string | boolean) => {
    setEntries(entries.map(entry =>
      entry.id === id ? { ...entry, [field]: value } : entry
    ));

    // Handle name suggestions
    if (field === 'name' && typeof value === 'string') {
      if (value.trim() === '') {
        setShowSuggestions(prev => ({ ...prev, [id]: false }));
      } else {
        // Filter suggestions based on input
        const filtered = allSavedNames.filter(name =>
          name.toLowerCase().includes(value.toLowerCase()) && name !== value
        );
        setFilteredSuggestions(prev => ({ ...prev, [id]: filtered }));
        setShowSuggestions(prev => ({ ...prev, [id]: filtered.length > 0 }));

        // If this is a new name (not in suggestions), add it to allSavedNames for immediate availability
        // Only add complete words (more than 2 characters) to avoid noise
        if (value.trim() !== '' && value.trim().length > 2 && !allSavedNames.includes(value.trim())) {
          setAllSavedNames(prev => [...prev, value.trim()]);
          // console.log('[CLIENT_INPUT] New name added to suggestions:', value.trim());
        }
      }
    }
  };

  const selectSuggestion = (entryId: string, suggestedName: string) => {
    setEntries(entries.map(entry =>
      entry.id === entryId ? { ...entry, name: suggestedName } : entry
    ));
    setShowSuggestions(prev => ({ ...prev, [entryId]: false }));
  };

  const toggleNameEdit = (id: string) => {
    setEntries(entries.map(entry =>
      entry.id === id ? { ...entry, isEditingName: !entry.isEditingName } : entry
    ));
  };

  const handleBalanceChange = (id: string, value: string) => {
    // Allow only numbers and negative sign
    if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
      updateEntry(id, 'balance', value);
    }
  };

  return (
    <div className="space-y-1">
      {/* Total Client Balance Display with Plus Button */}
      <div>
        <Label className="text-sm font-medium">Client Balance</Label>
        <div className="relative">
          <Input
            type="text"
            inputMode="numeric"
            value={isExpanded ? value : directValue}
            onChange={(e) => handleDirectValueChange(e.target.value)}
            readOnly={isExpanded}
            className={`text-right font-mono h-10 sm:h-9 mt-1 pr-10 ${isExpanded ? 'bg-muted/50 cursor-not-allowed' : ''}`}
            placeholder="0"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleExpandToggle}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-7 sm:w-7 p-0"
          >
            <Plus className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-45' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Dynamic Entries - Collapsible */}
      {isExpanded && (
        <div className="space-y-1">
          {entries.map((entry, index) => (
            <div key={entry.id} className="border rounded-md p-2 sm:p-1.5 space-y-2 sm:space-y-1">
              <div className="flex items-center justify-end mb-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEntry(entry.id)}
                  className="text-destructive hover:text-destructive/80 h-6 w-6 sm:h-4 sm:w-4 p-0"
                >
                  <Trash2 className="w-3 h-3 sm:w-2.5 sm:h-2.5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-1.5">
                <div className="relative">
                  <Input
                    type="text"
                    value={entry.name}
                    onChange={(e) => updateEntry(entry.id, 'name', e.target.value)}
                    onFocus={() => {
                      if (allSavedNames.length > 0) {
                        const filtered = allSavedNames.filter(name => name !== entry.name);
                        setFilteredSuggestions(prev => ({ ...prev, [entry.id]: filtered }));
                        setShowSuggestions(prev => ({ ...prev, [entry.id]: filtered.length > 0 }));
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding suggestions to allow clicking
                      setTimeout(() => {
                        setShowSuggestions(prev => ({ ...prev, [entry.id]: false }));
                      }, 200);
                    }}
                    readOnly={!entry.isEditingName}
                    className={`pr-6 h-8 sm:h-7 text-sm sm:text-xs ${!entry.isEditingName ? 'bg-muted/30' : ''}`}
                    placeholder="Client name"
                  />

                  {/* Suggestions Dropdown */}
                  {showSuggestions[entry.id] && filteredSuggestions[entry.id] && filteredSuggestions[entry.id].length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-[60] bg-white border border-gray-200 rounded-md shadow-xl max-h-32 overflow-y-auto mt-1">
                      {filteredSuggestions[entry.id].map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 border-b border-gray-100 last:border-b-0 transition-colors"
                          onClick={() => selectSuggestion(entry.id, suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {entry.name && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleNameEdit(entry.id)}
                      className="absolute right-0.5 top-1/2 -translate-y-1/2 h-4 w-4 p-0"
                    >
                      {entry.isEditingName ? (
                        <Check className="w-2 h-2 text-green-600" />
                      ) : (
                        <Edit className="w-2 h-2" />
                      )}
                    </Button>
                  )}
                </div>

                <Input
                  type="text"
                  inputMode="numeric"
                  value={entry.balance}
                  onChange={(e) => handleBalanceChange(entry.id, e.target.value)}
                  onFocus={(e) => {
                    if (entry.balance === '0') {
                      updateEntry(entry.id, 'balance', '');
                    }
                  }}
                  onBlur={(e) => {
                    if (entry.balance === '') {
                      updateEntry(entry.id, 'balance', '0');
                    }
                  }}
                  className="text-right h-8 sm:h-7 text-sm sm:text-xs"
                  placeholder="0"
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addEntry}
            className="w-full h-7 text-xs flex items-center gap-1"
          >
            <Plus className="w-2.5 h-2.5" />
            Add Entry
          </Button>
        </div>
      )}
    </div>
  );
};
