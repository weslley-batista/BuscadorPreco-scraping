'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { SearchBar, SearchResults, SearchFilters } from '@/components';
import { SearchFilters as SearchFiltersType } from '@/types';
import { useSearch } from '@/hooks/useSearch';
import { useDebounce } from '@/hooks/useDebounce';

export default function Home() {
  const [filters, setFilters] = useState<SearchFiltersType>({});
  const [searchInput, setSearchInput] = useState('');

  const { searchResults, isLoading, error, search } = useSearch();

  const debouncedSearchInput = useDebounce(searchInput, 500);

  const availableStores = useMemo(() => [
    'Amazon',
    'Magazine Luiza',
    'Casas Bahia'
  ], []);

  useEffect(() => {
    if (debouncedSearchInput.trim()) {
      search(debouncedSearchInput.trim(), filters);
    }
  }, [debouncedSearchInput, filters, search]);

  const handleImmediateSearch = useCallback((query: string) => {
    setSearchInput(query);
    if (query.trim()) {
      search(query.trim(), filters);
    }
  }, [filters, search]);


  const handleFiltersChange = useCallback((newFilters: SearchFiltersType) => {
    setFilters(newFilters);
    if (searchInput.trim()) {
      search(searchInput.trim(), newFilters);
    }
  }, [searchInput, search]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🛒 Buscador de Preços
            </h1>
            <p className="text-lg text-gray-600">
              Compare preços em múltiplas lojas e encontre as melhores ofertas
            </p>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Barra de busca */}
          <div className="flex justify-center">
            <SearchBar
              onSearch={handleImmediateSearch}
              isLoading={isLoading}
            />
          </div>

          {/* Filtros */}
          <SearchFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            availableStores={availableStores}
            className="max-w-4xl mx-auto"
          />

          {/* Resultados */}
          <SearchResults
            results={searchResults || undefined}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p className="text-sm">
              Buscador de Preços • Desenvolvido com Next.js e TypeScript
            </p>
            <p className="text-xs mt-2">
              Dados fornecidos por Amazon, Magazine Luiza e Casas Bahia (simulados para demonstração)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
