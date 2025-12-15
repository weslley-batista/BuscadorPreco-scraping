'use client';

import { ProductResult } from '@/types';
import { ExternalLink, Clock } from 'lucide-react';

interface ProductCardProps {
  product: ProductResult;
  isBestDeal?: boolean;
  priceDifference?: number;
}

export function ProductCard({ product, isBestDeal = false, priceDifference }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (date: Date | string) => {
    let dateObj: Date;

    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return 'Data inválida';
    }

    if (isNaN(dateObj.getTime())) {
      return 'Data inválida';
    }

    try {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj);
    } catch (error) {
      console.error('Erro ao formatar data:', error, date);
      return 'Erro na data';
    }
  };

  const getStoreColor = (store: string) => {
    const colors = {
      'Amazon': 'bg-orange-100 text-orange-800 border-orange-200',
      'Magazine Luiza': 'bg-blue-100 text-blue-800 border-blue-200',
      'Casas Bahia': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[store as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative ${
      isBestDeal ? 'ring-2 ring-green-500 border-green-500' : 'border-gray-200'
    }`}>
      {isBestDeal && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
          ★ Melhor Oferta
        </div>
      )}

      {priceDifference && priceDifference > 0 && (
        <div className="absolute -top-2 -left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
          +{formatPrice(priceDifference)}
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {product.name}
          </h3>

          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getStoreColor(product.store)}`}>
            {product.store}
          </span>
        </div>
      </div>

      <div className="mb-3">
        <div className="text-2xl font-bold text-gray-900">
          {formatPrice(product.price)}
        </div>
        {product.currency && product.currency !== 'BRL' && (
          <div className="text-sm text-gray-500">
            ({product.currency})
          </div>
        )}
      </div>

      {product.lastUpdated && (
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Clock className="h-4 w-4 mr-1" />
          Atualizado: {formatDate(product.lastUpdated)}
        </div>
      )}

      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        <span>Ver na Loja</span>
        <ExternalLink className="ml-2 h-4 w-4" />
      </a>
    </div>
  );
}
