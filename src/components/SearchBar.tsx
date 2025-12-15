'use client';

import { useState, useCallback, FormEvent } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  onSearch,
  isLoading = false,
  placeholder = "Buscar produtos...",
  className = ""
}: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  }, [query, isLoading, onSearch]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  return (
    <form onSubmit={handleSubmit} className={`w-full max-w-2xl ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={isLoading}
          className="w-full px-4 py-3 pl-12 pr-12 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          autoComplete="off"
          autoFocus
        />

        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />

        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Buscando...</span>
            </>
          ) : (
            <span>Buscar</span>
          )}
        </button>
      </div>

      <div className="mt-2 text-sm text-gray-500 text-center">
        Exemplo: &quot;iPhone 13&quot;, &quot;notebook dell&quot;, &quot;smart TV samsung&quot;
      </div>
    </form>
  );
}
