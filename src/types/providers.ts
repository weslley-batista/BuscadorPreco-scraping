
import { RawProductData, PriceProvider } from './index';

export interface AmazonProductData extends RawProductData {
  asin?: string;
  rating?: number;
  reviewCount?: number;
  prime?: boolean;
  sponsored?: boolean;
}

export interface MagazineLuizaProductData extends RawProductData {
  productId?: string;
  category?: string;
  brand?: string;
  installment?: {
    count: number;
    value: number;
  };
}

export interface CasasBahiaProductData extends RawProductData {
  sku?: string;
  model?: string;
  warranty?: string;
  delivery?: {
    free: boolean;
    estimatedDays: number;
  };
}

export interface GenericProvider extends PriceProvider {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface ProviderConfig {
  name: string;
  enabled: boolean;
  priority: number; // Ordem de execução (menor número = maior prioridade)
  timeout?: number;
  maxRetries?: number;
  weight?: number; // Peso na ordenação final
}

export type ProviderDataTypes = {
  amazon: AmazonProductData;
  'magazine-luiza': MagazineLuizaProductData;
  'casas-bahia': CasasBahiaProductData;
  generic: RawProductData;
};

export type ProviderFactory = (
  config: ProviderConfig
) => PriceProvider;

export interface ProviderRegistry {
  [key: string]: {
    factory: ProviderFactory;
    config: ProviderConfig;
  };
}
