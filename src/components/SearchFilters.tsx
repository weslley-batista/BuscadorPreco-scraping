'use client';

import { useState } from 'react';
import { SearchFilters as SearchFiltersType } from '@/types';
import { Filter, X } from 'lucide-react';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
  availableStores: string[];
  className?: string;
}

export function SearchFilters({
  filters,
  onFiltersChange,
  availableStores,
  className = ""
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const minPrice = filters.minPrice?.toString() || '';
  const maxPrice = filters.maxPrice?.toString() || '';
  const selectedStores = filters.stores || [];

  const handleStoreToggle = (store: string) => {
    const newStores = selectedStores.includes(store)
      ? selectedStores.filter(s => s !== store)
      : [...selectedStores, store];

    updateFilters({ stores: newStores.length > 0 ? newStores : undefined });
  };

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    updateFilters({ [type === 'min' ? 'minPrice' : 'maxPrice']: numValue });
  };

  const updateFilters = (updates: Partial<SearchFiltersType>) => {
    const newFilters = { ...filters, ...updates };

    Object.keys(newFilters).forEach(key => {
      const value = newFilters[key as keyof SearchFiltersType];
      if (value === undefined ||
          (typeof value === 'string' && value === '') ||
          (Array.isArray(value) && value.length === 0)) {
        delete newFilters[key as keyof SearchFiltersType];
      }
    });

    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value =>
    value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0)
  );

  return (
    <div className={`border-b border-gray-200 pb-4 ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
      >
        <Filter className="h-4 w-4" />
        <span className="font-medium">
          Filtros
          {hasActiveFilters && (
            <span className="ml-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              ativo
            </span>
          )}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lojas
            </label>
            <div className="flex flex-wrap gap-2">
              {availableStores.map(store => (
                <button
                  key={store}
                  onClick={() => handleStoreToggle(store)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    selectedStores.includes(store)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {store}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Faixa de Preço (R$)
            </label>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Mínimo"
                  value={minPrice}
                  onChange={(e) => handlePriceChange('min', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Máximo"
                  value={maxPrice}
                  onChange={(e) => handlePriceChange('max', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
