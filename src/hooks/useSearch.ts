import { useState, useCallback, useRef } from 'react';
import { SearchResponse, SearchFilters as SearchFiltersType } from '@/types';

export function useSearch() {
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [lastQuery, setLastQuery] = useState<string>('');

  const abortControllerRef = useRef<AbortController | null>(null);

  const search = useCallback(async (query: string, filters?: SearchFiltersType) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError('');
    setLastQuery(query);

    try {
      const params = new URLSearchParams();
      params.set('q', query);

      if (filters?.stores && filters.stores.length > 0) {
        params.set('stores', filters.stores.join(','));
      }

      if (filters?.minPrice !== undefined) {
        params.set('minPrice', filters.minPrice.toString());
      }

      if (filters?.maxPrice !== undefined) {
        params.set('maxPrice', filters.maxPrice.toString());
      }

      const response = await fetch(`/api/search?${params.toString()}`, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro HTTP ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      setSearchResults(data);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Busca cancelada');
        return;
      }

      console.error('Erro na busca:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido na busca');
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setSearchResults(null);
    setError('');
    setLastQuery('');
  }, []);

  const retryLastSearch = useCallback(() => {
    if (lastQuery) {
      search(lastQuery);
    }
  }, [lastQuery, search]);

  return {
    searchResults,
    isLoading,
    error,
    lastQuery,
    search,
    clearResults,
    retryLastSearch,
    hasResults: searchResults !== null,
    hasError: error !== '',
  };
}
