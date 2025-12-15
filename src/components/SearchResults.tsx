'use client';

import { SearchResponse } from '@/types';
import { ProductCard } from './ProductCard';
import { Loader2, AlertCircle, Package } from 'lucide-react';

interface SearchResultsProps {
  results?: SearchResponse;
  isLoading?: boolean;
  error?: string;
}

export function SearchResults({ results, isLoading = false, error }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-lg text-gray-600">Buscando as melhores ofertas...</p>
        <p className="text-sm text-gray-500 mt-2">Consultando múltiplas lojas simultaneamente</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Erro na busca
        </h3>
        <p className="text-gray-600 text-center max-w-md">
          {error}
        </p>
      </div>
    );
  }

  if (!results || results.results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Package className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Digite um produto para buscar
        </h3>
        <p className="text-gray-600 text-center max-w-md">
          Use a barra de busca acima para encontrar produtos. Exemplos: &quot;iPhone 13&quot;, &quot;notebook dell&quot;, &quot;smart TV samsung&quot;
        </p>
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            Buscar iPhone (exemplo)
          </button>
        </div>
      </div>
    );
  }

  const bestPrice = Math.min(...results.results.map(p => p.price));
  const bestDealProduct = results.results.find(p => p.price === bestPrice);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Resultados para &quot;{results.query}&quot;
          </h2>
          <p className="text-gray-600 mt-1">
            {results.totalResults} produto{results.totalResults !== 1 ? 's' : ''} encontrado{results.totalResults !== 1 ? 's' : ''}
            {results.searchTime && (
              <span className="ml-2 text-sm">
                • Busca realizada em {(results.searchTime / 1000).toFixed(1)}s
              </span>
            )}
          </p>
        </div>

        {results.filters && (
          <div className="text-sm text-gray-500">
            <div>Filtros aplicados:</div>
            {results.filters.stores && (
              <div>Lojas: {results.filters.stores.join(', ')}</div>
            )}
            {results.filters.minPrice && (
              <div>Preço mín: R$ {results.filters.minPrice}</div>
            )}
            {results.filters.maxPrice && (
              <div>Preço máx: R$ {results.filters.maxPrice}</div>
            )}
          </div>
        )}
      </div>

      {bestDealProduct && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <span className="text-green-600 font-semibold">🏆 Melhor Oferta</span>
          </div>
          <div className="text-lg font-bold text-green-800">
            {bestDealProduct.name} - {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(bestDealProduct.price)}
          </div>
          <div className="text-sm text-green-600">
            na {bestDealProduct.store}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.results.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isBestDeal={product.price === bestPrice}
            priceDifference={product.price - bestPrice}
          />
        ))}
      </div>

      <div className="text-center text-sm text-gray-500 pt-6 border-t">
        <p>
          Preços atualizados automaticamente • Resultados ordenados por menor preço
        </p>
      </div>
    </div>
  );
}
