import React, { useState, useEffect, useRef } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Utensils, Plus, Pencil, Check, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const LOCAL_STORAGE_TABLES_KEY = 'escrow_cafe_tables_list';
const DEFAULT_TABLES = ['Table 1', 'Table 2', 'Table 3', 'Table 4'];

const getStoredTables = (): string[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TABLES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // filter non-empty strings
        const filtered = parsed.map(t => String(t).trim()).filter(Boolean);
        if (filtered.length > 0) return filtered;
      }
    }
  } catch (e) {
    console.error('Error reading cafe tables from storage:', e);
  }
  return DEFAULT_TABLES;
};

interface CafeOrderModeSelectorProps {
  orderMode: 'takeaway' | 'dine_in';
  onSelectOrderMode: (mode: 'takeaway' | 'dine_in') => void;
  cafeTable?: string;
  onSelectTable: (tbl: string) => void;
}

export const CafeOrderModeSelector: React.FC<CafeOrderModeSelectorProps> = ({
  orderMode,
  onSelectOrderMode,
  cafeTable,
  onSelectTable
}) => {
  const [tables, setTables] = useState<string[]>(() => {
    const stored = getStoredTables();
    return stored.length > 0 ? stored : DEFAULT_TABLES;
  });

  const [newTableName, setNewTableName] = useState('');
  const [showAddTableInput, setShowAddTableInput] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Active table calculation
  const activeTableDisplay = (cafeTable && cafeTable !== 'Takeaway' && tables.includes(cafeTable))
    ? cafeTable
    : (tables[0] || 'Table 1');

  // Keep parent in sync if cafeTable is Dine-In but not in tables list
  useEffect(() => {
    if (orderMode === 'dine_in') {
      if (!cafeTable || cafeTable === 'Takeaway' || !tables.includes(cafeTable)) {
        if (tables.length > 0) {
          onSelectTable(tables[0]);
        }
      }
    }
  }, [orderMode, tables, cafeTable, onSelectTable]);

  // Focus add input when opened
  useEffect(() => {
    if (showAddTableInput && addInputRef.current) {
      addInputRef.current.focus();
      addInputRef.current.select();
    }
  }, [showAddTableInput]);

  // Focus edit input when opened
  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingIndex]);

  const handleOpenAddTable = () => {
    // Generate intelligent next table name (e.g. find highest number among "Table X")
    let highestNum = 0;
    tables.forEach((t) => {
      const match = t.match(/table\s*(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > highestNum) highestNum = num;
      }
    });
    const suggested = highestNum > 0 ? `Table ${highestNum + 1}` : `Table ${tables.length + 1}`;
    setNewTableName(suggested);
    setShowAddTableInput(true);
  };

  const handleAddTable = () => {
    const trimmed = newTableName.trim();
    if (!trimmed) {
      setShowAddTableInput(false);
      return;
    }

    // Check if table already exists (case-insensitive)
    const existing = tables.find(t => t.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      onSelectTable(existing);
      setShowAddTableInput(false);
      setNewTableName('');
      return;
    }

    const nextTables = [...tables, trimmed];
    setTables(nextTables);
    try {
      localStorage.setItem(LOCAL_STORAGE_TABLES_KEY, JSON.stringify(nextTables));
    } catch (e) {
      console.error(e);
    }
    onSelectTable(trimmed);
    setNewTableName('');
    setShowAddTableInput(false);
  };

  const handleStartEdit = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingIndex(index);
    setEditingValue(tables[index]);
  };

  const handleSaveEdit = (index: number) => {
    const trimmed = editingValue.trim();
    if (!trimmed) {
      setEditingIndex(null);
      return;
    }

    const oldName = tables[index];
    // Check if renamed to another existing table name (other than self)
    const duplicate = tables.some((t, i) => i !== index && t.toLowerCase() === trimmed.toLowerCase());
    if (duplicate) {
      // Don't overwrite another table, just close
      setEditingIndex(null);
      return;
    }

    const nextTables = [...tables];
    nextTables[index] = trimmed;
    setTables(nextTables);
    try {
      localStorage.setItem(LOCAL_STORAGE_TABLES_KEY, JSON.stringify(nextTables));
    } catch (e) {
      console.error(e);
    }

    if (cafeTable === oldName || activeTableDisplay === oldName) {
      onSelectTable(trimmed);
    }
    setEditingIndex(null);
  };

  const handleDeleteTable = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tables.length <= 1) {
      // Prevent deleting last remaining table
      return;
    }

    const removedName = tables[index];
    const isRemovingActive = (cafeTable === removedName) || (activeTableDisplay === removedName);
    const nextTables = tables.filter((_, i) => i !== index);

    setTables(nextTables);
    try {
      localStorage.setItem(LOCAL_STORAGE_TABLES_KEY, JSON.stringify(nextTables));
    } catch (e) {
      console.error(e);
    }

    if (isRemovingActive) {
      // Pick neighbor table or first
      const newActiveIndex = Math.min(index, nextTables.length - 1);
      const fallback = nextTables[newActiveIndex] || nextTables[0] || 'Table 1';
      onSelectTable(fallback);
    }

    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3.5">
      {/* Step 1: Mode Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white font-mono font-black text-xs shadow-sm">
            1
          </span>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Select Order Mode</span>
              <span className="text-[11px] font-normal text-muted-foreground hidden sm:inline">• Choose dining type before billing</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Current Status:</span>
          <Badge className={cn(
            "font-bold text-xs px-2.5 py-1 rounded-lg shadow-xs",
            orderMode === 'takeaway'
              ? "bg-emerald-600 text-white"
              : "bg-amber-600 text-white"
          )}>
            {orderMode === 'takeaway' ? '🥡 Takeaway / Parcel' : `🍽️ Dine-In (${activeTableDisplay})`}
          </Badge>
        </div>
      </div>

      {/* 2-Option Selector: Dine-In first, Takeaway second */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
        {/* Dine-In Button (First) */}
        <button
          type="button"
          onClick={() => onSelectOrderMode('dine_in')}
          className={cn(
            "group relative flex items-center gap-3.5 p-3 sm:p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left select-none",
            orderMode === 'dine_in'
              ? "bg-amber-500/10 border-amber-600 text-slate-900 dark:text-slate-100 ring-2 ring-amber-500/20 shadow-md shadow-amber-600/5"
              : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-amber-400 text-slate-600 dark:text-slate-300"
          )}
        >
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-105",
            orderMode === 'dine_in' ? "bg-amber-600 text-white shadow-sm" : "bg-slate-200 dark:bg-slate-700"
          )}>
            🍽️
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-slate-900 dark:text-slate-100">Dine-In Service</span>
              {orderMode === 'dine_in' && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-600 text-white">Active</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Sitting &amp; table service • Choose table below</p>
          </div>
        </button>

        {/* Takeaway Button (Second) */}
        <button
          type="button"
          onClick={() => onSelectOrderMode('takeaway')}
          className={cn(
            "group relative flex items-center gap-3.5 p-3 sm:p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left select-none",
            orderMode === 'takeaway'
              ? "bg-amber-500/10 border-amber-600 text-slate-900 dark:text-slate-100 ring-2 ring-amber-500/20 shadow-md shadow-amber-600/5"
              : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-amber-400 text-slate-600 dark:text-slate-300"
          )}
        >
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-105",
            orderMode === 'takeaway' ? "bg-amber-600 text-white shadow-sm" : "bg-slate-200 dark:bg-slate-700"
          )}>
            🥡
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-slate-900 dark:text-slate-100">Takeaway / Parcel</span>
              {orderMode === 'takeaway' && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-600 text-white">Active</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Quick parcel counter • No table needed</p>
          </div>
        </button>
      </div>

      {/* STEP 2: DINE-IN TABLE SELECTION FLOW */}
      {orderMode === 'dine_in' && (
        <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-1 duration-200 space-y-3">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-50/60 dark:bg-amber-950/20 p-2.5 sm:px-3 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-600 text-white font-mono font-black text-[11px] shadow-xs">
                2
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-amber-600" />
                <span>Step 2: Assign Dining Table</span>
              </span>
              <span className="text-[11px] text-muted-foreground hidden md:inline">
                (Click table to select • ✏️ to rename • ✕ to remove)
              </span>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Selected:</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-600 text-white text-xs font-black shadow-xs tracking-tight">
                <CheckCircle2 className="w-3 h-3 text-amber-200" />
                {activeTableDisplay}
              </span>
            </div>
          </div>

          {/* Table Chips & Add Control */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-0.5">
            {tables.map((tbl, idx) => {
              const isSelected = activeTableDisplay === tbl;
              const isEditing = editingIndex === idx;

              // Inline Edit Mode
              if (isEditing) {
                return (
                  <div
                    key={`edit-${idx}`}
                    className="flex items-center gap-1.5 p-1 rounded-xl border-2 border-amber-500 bg-white dark:bg-slate-900 shadow-md animate-in fade-in"
                  >
                    <Input
                      ref={editInputRef}
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(idx);
                        if (e.key === 'Escape') setEditingIndex(null);
                      }}
                      className="h-8 text-xs sm:text-sm w-28 sm:w-32 px-2.5 font-bold border-none focus-visible:ring-0 bg-transparent text-foreground"
                      placeholder="Table name"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(idx)}
                      className="h-7 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                      title="Save name"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingIndex(null)}
                      className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              // Standard Table Chip (Entire container is clickable to select!)
              return (
                <div
                  key={tbl}
                  onClick={() => onSelectTable(tbl)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectTable(tbl);
                    }
                  }}
                  className={cn(
                    "group relative flex items-center gap-2 pl-3.5 pr-1.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border cursor-pointer select-none shadow-xs",
                    isSelected
                      ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-600 shadow-md shadow-amber-600/20 ring-2 ring-amber-500/40"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-slate-800/90"
                  )}
                >
                  {/* Table Label with Icon */}
                  <span className="flex items-center gap-1.5 font-bold tracking-tight">
                    <span className="text-xs">🍽️</span>
                    <span>{tbl}</span>
                  </span>

                  {/* Selected Indicator Badge inside chip */}
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-200 animate-pulse" />
                  )}

                  {/* Actions: Edit & Remove */}
                  <div className="flex items-center gap-0.5 ml-1">
                    <button
                      type="button"
                      title={`Rename ${tbl}`}
                      onClick={(e) => handleStartEdit(idx, e)}
                      className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer",
                        isSelected
                          ? "text-amber-100 hover:text-white hover:bg-white/20 active:scale-95"
                          : "text-slate-400 hover:text-amber-600 hover:bg-amber-100/60 dark:hover:bg-slate-700 active:scale-95"
                      )}
                    >
                      <Pencil className="w-3 h-3" />
                    </button>

                    {tables.length > 1 && (
                      <button
                        type="button"
                        title={`Remove ${tbl}`}
                        onClick={(e) => handleDeleteTable(idx, e)}
                        className={cn(
                          "w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer",
                          isSelected
                            ? "text-amber-100 hover:text-rose-200 hover:bg-rose-600/60 active:scale-95"
                            : "text-slate-400 hover:text-rose-600 hover:bg-rose-100/60 dark:hover:bg-slate-700 active:scale-95"
                        )}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* + Add Table Control / Inline Form */}
            {!showAddTableInput ? (
              <button
                type="button"
                onClick={handleOpenAddTable}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-2 border-dashed border-amber-300 dark:border-amber-700/60 transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>+ Add Table</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 p-1 rounded-xl border-2 border-amber-500 bg-white dark:bg-slate-900 shadow-md animate-in fade-in">
                <Input
                  ref={addInputRef}
                  placeholder={`e.g. Table ${tables.length + 1}`}
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTable();
                    if (e.key === 'Escape') setShowAddTableInput(false);
                  }}
                  className="h-8 text-xs sm:text-sm w-32 sm:w-40 px-2.5 font-bold border-none focus-visible:ring-0 bg-transparent text-foreground"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddTable}
                  className="h-7 px-2.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  Add
                </Button>
                <button
                  type="button"
                  onClick={() => setShowAddTableInput(false)}
                  className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
