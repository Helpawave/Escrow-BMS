import React from 'react';
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";

interface ProductFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchLoading: boolean;
  categoryFilter: string;
  setCategoryFilter: (cat: string) => void;
  availableCategories: { value: string; label: string }[];
  typeFilter: string;
  setTypeFilter: (type: string) => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  searchLoading,
  categoryFilter,
  setCategoryFilter,
  availableCategories,
  typeFilter,
  setTypeFilter,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products by name, SKU, category..."
          className="pl-10 h-11 bg-background border-border/50 rounded-xl"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="w-full sm:w-44">
        <select
          className="w-full h-11 rounded-xl border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium capitalize"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {availableCategories.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      <div className="w-full sm:w-36">
        <select
          className="w-full h-11 rounded-xl border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="product">Products</option>
          <option value="service">Services</option>
        </select>
      </div>
    </div>
  );
};
