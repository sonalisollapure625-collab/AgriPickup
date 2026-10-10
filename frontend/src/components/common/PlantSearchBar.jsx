import React from 'react';
import { Search, X, Loader2 } from 'lucide-react';

export default function PlantSearchBar({
  searchTerm,
  onSearchChange,
  onClear,
  loading = false,
  placeholder = "Search plants by name, category, or nursery…",
}) {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <div className="absolute left-4 text-emerald-600 pointer-events-none flex items-center justify-center">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          ) : (
            <Search className="w-5 h-5 text-emerald-600" />
          )}
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-3.5 sm:py-4 rounded-2xl bg-white border border-emerald-200/90 shadow-md shadow-emerald-100/50 text-slate-800 placeholder-slate-400 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-slate-500 text-center">
        Search for plants, fruits, flowers, or nurseries.
      </p>
    </div>
  );
}
