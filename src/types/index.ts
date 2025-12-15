
export interface ProductResult {
  id: string;
  name: string;
  price: number;
  store: string;
  url: string;
  lastUpdated: Date | string;
  currency?: string;
}

export interface RawProductData {
  name?: string;
  title?: string;
  price?: number;
  value?: number;
  cost?: number;
  store: string;
  url?: string;
  link?: string;
  href?: string;
  lastUpdated?: Date | string;
  [key: string]: unknown; // Permite campos adicionais específicos de cada provider
}

export interface SearchConfig {
  query: string;
  maxResults?: number;
  timeout?: number;
}

export interface SearchFilters {
  stores?: string[];
  minPrice?: number;
  maxPrice?: number;
}

export interface SearchResponse {
  results: ProductResult[];
  totalResults: number;
  searchTime: number;
  query: string;
  filters?: SearchFilters;
}

export interface PriceProvider {
  name: string;
  search(query: string): Promise<RawProductData[]>;
}

export interface SearchResult {
  product: ProductResult;
  isBestDeal: boolean;
  priceDifference?: number; // Diferença para o melhor preço
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export type CacheStore<T = unknown> = Map<string, CacheEntry<T>>;

export type { ProviderRegistry, ProviderFactory, ProviderConfig } from './providers';

export interface ProviderError {
  provider: string;
  error: string;
  timestamp: Date;
}

export const DEFAULT_CURRENCY = 'BRL';
export const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
export const SEARCH_TIMEOUT = 10000; // 10 segundos
export const MAX_RESULTS_PER_PROVIDER = 20;
