
import { PriceProvider, ProductResult, SearchConfig, SearchResponse, SearchFilters, ProviderError, CACHE_TTL, SEARCH_TIMEOUT, MAX_RESULTS_PER_PROVIDER } from '@/types';
import { getEnabledProviders } from '@/providers';
import { dataNormalizer } from './normalizer';
import { cacheService } from './cache';

export class SearchService {
  private providers: PriceProvider[];

  constructor(providers?: PriceProvider[]) {
    this.providers = providers || getEnabledProviders();
  }

  async search(config: SearchConfig, filters?: SearchFilters): Promise<SearchResponse> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(config.query, filters);

    const cachedResult = cacheService.get<SearchResponse>(cacheKey);
    if (cachedResult) {
      console.log('Resultado retornado do cache');
      return cachedResult;
    }

    try {
      const searchPromises = this.providers.map(provider =>
        this.searchWithProvider(provider, config.query, config.timeout)
      );

      const results = await Promise.allSettled(searchPromises);

      const allProducts: ProductResult[] = [];
      const errors: ProviderError[] = [];

      results.forEach((result, index) => {
        const provider = this.providers[index];

        if (result.status === 'fulfilled') {
          const products = result.value;
          allProducts.push(...products);
        } else {
          errors.push({
            provider: provider.name,
            error: result.reason?.message || 'Unknown error',
            timestamp: new Date()
          });
        }
      });

      let filteredProducts = allProducts;
      if (filters) {
        filteredProducts = this.applyFilters(allProducts, filters);
      }

      const sortedProducts = filteredProducts.sort((a, b) => a.price - b.price);

      const finalResults = config.maxResults
        ? sortedProducts.slice(0, config.maxResults)
        : sortedProducts;

      const response: SearchResponse = {
        results: finalResults,
        totalResults: finalResults.length,
        searchTime: Date.now() - startTime,
        query: config.query,
        filters
      };

      cacheService.set(cacheKey, response, CACHE_TTL);

      if (errors.length > 0) {
        console.warn(`Busca "${config.query}" teve ${errors.length} erro(s) de provider:`, errors);
      }

      return response;

    } catch (error) {
      console.error('Erro crítico na busca:', error);
      throw new Error(`Falha na busca: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private async searchWithProvider(
    provider: PriceProvider,
    query: string,
    timeout: number = SEARCH_TIMEOUT
  ): Promise<ProductResult[]> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout após ${timeout}ms`)), timeout);
    });

    const searchPromise = provider.search(query).then(rawDataList => {
      const limitedData = rawDataList.slice(0, MAX_RESULTS_PER_PROVIDER);
      return dataNormalizer.normalizeList(limitedData);
    });

    return Promise.race([searchPromise, timeoutPromise]);
  }

  private applyFilters(products: ProductResult[], filters: SearchFilters): ProductResult[] {
    return products.filter(product => {
      if (filters.stores && filters.stores.length > 0) {
        if (!filters.stores.includes(product.store)) {
          return false;
        }
      }

      if (filters.minPrice !== undefined && product.price < filters.minPrice) {
        return false;
      }

      if (filters.maxPrice !== undefined && product.price > filters.maxPrice) {
        return false;
      }

      return true;
    });
  }

  private generateCacheKey(query: string, filters?: SearchFilters): string {
    const normalizedQuery = query.toLowerCase().trim();
    const filterKey = filters ? JSON.stringify(filters) : '';
    return `search:${normalizedQuery}:${filterKey}`;
  }

  clearCache(): void {
    cacheService.clear();
  }

  addProvider(provider: PriceProvider): void {
    this.providers.push(provider);
  }

  removeProvider(providerName: string): void {
    this.providers = this.providers.filter(p => p.name !== providerName);
  }

  getProviderStats(): Array<{ name: string; enabled: boolean }> {
    return this.providers.map(p => ({
      name: p.name,
      enabled: true // Todos os providers na lista estão habilitados
    }));
  }
}

export const searchService = new SearchService();
