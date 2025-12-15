/**
 * Provider real da Casas Bahia
 * Implementa scraping da página de busca da Casas Bahia
 * 
 * Estratégia:
 * - Busca na página de resultados da Casas Bahia
 * - Extrai produtos usando seletores CSS específicos
 * - Normaliza preços e URLs
 * - Trata informações de entrega e garantia
 */

import { load } from 'cheerio';
import { BasePriceProvider } from './base';
import { RawProductData } from '@/types';
import { CasasBahiaProductData } from '@/types/providers';
import { normalizePrice, cleanText, resolveUrl } from '@/utils/scraping';

export class CasasBahiaProvider extends BasePriceProvider {
  private readonly searchUrl = 'https://www.casasbahia.com.br/busca';

  constructor(
    name: string = 'Casas Bahia',
    baseUrl: string = 'https://www.casasbahia.com.br',
    timeout: number = 10000,
    maxRetries: number = 2
  ) {
    super(name, baseUrl, timeout, maxRetries, 1200);
  }

  async search(query: string): Promise<RawProductData[]> {
    try {
      await this.delay();

      // Tenta primeiro buscar via API interna
      try {
        const apiResults = await this.searchViaAPI(query);
        if (apiResults.length > 0) {
          return apiResults.slice(0, 20);
        }
      } catch (apiError) {
        console.warn(`[Casas Bahia] API falhou, tentando scraping:`, apiError);
      }

      // Fallback para scraping
      const searchUrl = this.buildSearchUrl(query);
      const response = await this.fetch(searchUrl);

      if (!response.ok) {
        throw new Error(`Casas Bahia retornou status ${response.status}`);
      }

      const html = await response.text();
      const products = this.parseSearchResults(html, query);

      return products.slice(0, 20);

    } catch (error) {
      console.error(`[Casas Bahia] Erro ao buscar "${query}":`, error);
      return [];
    }
  }

  /**
   * Tenta buscar via API interna da Casas Bahia
   */
  private async searchViaAPI(query: string): Promise<CasasBahiaProductData[]> {
    // A Casas Bahia geralmente usa APIs internas para busca
    // Tentamos encontrar endpoints de API na página
    const apiUrl = `https://www.casasbahia.com.br/busca/${encodeURIComponent(query)}`;
    
    const response = await this.fetch(apiUrl, {
      headers: {
        'Accept': 'application/json, text/html, */*',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    const text = await response.text();
    
    // Procura por dados JSON embutidos
    const jsonMatch = text.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/) ||
                     text.match(/window\.__PRELOADED_STATE__\s*=\s*({.+?});/);
    
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        return this.parseAPIResponse(data);
      } catch {
        // Continua para scraping
      }
    }

    throw new Error('API não retornou dados válidos');
  }

  /**
   * Faz parse da resposta da API
   */
  private parseAPIResponse(data: Record<string, unknown>): CasasBahiaProductData[] {
    const products: CasasBahiaProductData[] = [];

    const productList = (data.products ||
                       (data.search as Record<string, unknown>)?.products ||
                       (data.entities as Record<string, unknown>)?.products ||
                       data.items ||
                       []) as unknown[];

    for (const item of productList) {
      try {
        const product = this.extractProductFromAPI(item as Record<string, unknown>);
        if (product && this.validateData(product)) {
          products.push(product);
        }
      } catch (error) {
        console.warn(`[Casas Bahia] Erro ao processar produto da API:`, error);
      }
    }

    return products;
  }

  /**
   * Extrai produto da resposta da API
   */
  private extractProductFromAPI(item: Record<string, unknown>): CasasBahiaProductData | null {
    const name = (item.name || item.title || item.productName || item.description) as string | undefined;
    const price = item.price || item.value || item.salePrice || 
                  (item.priceInfo as Record<string, unknown>)?.price || item.cost;
    const sku = (item.sku || item.id || item.productId || item.code) as string | undefined;
    const url = (item.url || item.link || item.productUrl || item.href) as string | undefined;
    const model = (item.model || item.modelName) as string | undefined;

    if (!name || !price || !url) {
      return null;
    }

    const normalizedPrice = typeof price === 'number' ? price : normalizePrice(String(price));
    if (!normalizedPrice || normalizedPrice <= 0) {
      return null;
    }

    return {
      store: 'Casas Bahia',
      name,
      title: name,
      cost: normalizedPrice,
      price: normalizedPrice,
      url: resolveUrl(this.baseUrl!, url),
      sku: String(sku),
      model,
      warranty: (item.warranty || item.warrantyPeriod) as string | undefined,
      delivery: item.delivery ? {
        free: ((item.delivery as Record<string, unknown>).free || (item.delivery as Record<string, unknown>).freeShipping || false) as boolean,
        estimatedDays: ((item.delivery as Record<string, unknown>).estimatedDays || (item.delivery as Record<string, unknown>).days || 0) as number
      } : undefined,
      lastUpdated: new Date()
    };
  }

  /**
   * Constrói URL de busca
   */
  private buildSearchUrl(query: string): string {
    return `${this.searchUrl}/${encodeURIComponent(query)}`;
  }

  /**
   * Faz parse do HTML da página de resultados
   */
  private parseSearchResults(html: string, query: string): CasasBahiaProductData[] {
    const $ = load(html);
    const products: CasasBahiaProductData[] = [];

    // Seletores para produtos na Casas Bahia
    const productSelectors = [
      '[data-testid="product-card"]',
      '.product-card',
      '[data-product-id]',
      '.product-item',
      'li[data-testid="product"]',
      '.vitrine-product'
    ];

    let productElements = $('');

    for (const selector of productSelectors) {
      productElements = $(selector);
      if (productElements.length > 0) {
        break;
      }
    }

    if (productElements.length === 0) {
      console.warn(`[Casas Bahia] Nenhum produto encontrado para "${query}"`);
      return [];
    }

    productElements.each((_, element) => {
      try {
        const $element = $(element);
        const product = this.extractProductData($element);

        if (product && this.validateData(product)) {
          products.push(product);
        }
      } catch (error) {
        console.warn(`[Casas Bahia] Erro ao extrair produto:`, error);
      }
    });

    return products;
  }

  /**
   * Extrai dados de um produto individual do HTML
   */
  private extractProductData(
    $element: ReturnType<ReturnType<typeof load>>
  ): CasasBahiaProductData | null {
    // Extrai SKU/ID do produto
    const sku = $element.attr('data-product-id') ||
               $element.attr('data-sku') ||
               $element.find('[data-product-id]').first().attr('data-product-id') ||
               null;

    // Extrai nome/título
    const nameSelectors = [
      '[data-testid="product-title"]',
      '.product-title',
      'h2 a',
      'h3 a',
      '.product-name',
      'a[data-testid="product-link"]',
      '.vitrine-product-name'
    ];

    let name = '';
    for (const selector of nameSelectors) {
      name = cleanText($element.find(selector).first().text());
      if (name) break;
    }

    if (!name) {
      return null;
    }

    // Extrai preço
    const priceSelectors = [
      '[data-testid="price-value"]',
      '.price',
      '.product-price',
      '[data-testid="product-price"]',
      '.price-value',
      '.price-current',
      '.vitrine-price'
    ];

    let priceText = '';
    for (const selector of priceSelectors) {
      priceText = cleanText($element.find(selector).first().text());
      if (priceText) break;
    }

    // Busca por padrão de preço no texto
    if (!priceText) {
      const priceMatch = $element.text().match(/R\$\s*[\d.,]+/);
      priceText = priceMatch ? priceMatch[0] : '';
    }

    const price = normalizePrice(priceText);
    if (!price || price <= 0) {
      return null;
    }

    // Extrai URL
    const linkSelectors = [
      'a[data-testid="product-link"]',
      'a[href*="/produto/"]',
      'h2 a',
      'h3 a',
      '.product-link',
      '.vitrine-product-link'
    ];

    let productUrl = '';
    for (const selector of linkSelectors) {
      const href = $element.find(selector).first().attr('href');
      if (href) {
        productUrl = resolveUrl(this.baseUrl!, href);
        break;
      }
    }

    if (!productUrl) {
      return null;
    }

    // Extrai modelo (opcional)
    const model = cleanText($element.find('[data-testid="product-model"]').first().text()) ||
                 cleanText($element.find('.product-model').first().text()) ||
                 undefined;

    // Extrai garantia (opcional)
    const warrantyText = cleanText($element.find('[data-testid="warranty"]').first().text()) ||
                        cleanText($element.find('.warranty').first().text()) ||
                        '';
    
    let warranty: string | undefined;
    if (warrantyText) {
      const warrantyMatch = warrantyText.match(/(\d+)\s*(meses?|anos?)/i);
      warranty = warrantyMatch ? warrantyText : undefined;
    }

    // Extrai informações de entrega (opcional)
    const deliveryText = cleanText($element.find('[data-testid="delivery"]').first().text()) ||
                        cleanText($element.find('.delivery-info').first().text()) ||
                        '';
    
    let delivery;
    if (deliveryText) {
      const freeShipping = deliveryText.toLowerCase().includes('grátis') ||
                          deliveryText.toLowerCase().includes('frete grátis') ||
                          deliveryText.toLowerCase().includes('entrega grátis');
      
      const daysMatch = deliveryText.match(/(\d+)\s*dias?/i);
      const estimatedDays = daysMatch ? parseInt(daysMatch[1]) : undefined;

      if (freeShipping || estimatedDays) {
        delivery = {
          free: freeShipping,
          estimatedDays: estimatedDays || 0
        };
      }
    }

    return {
      store: 'Casas Bahia',
      name,
      title: name,
      cost: price,
      price,
      url: productUrl,
      sku: sku || this.generateId('CB'),
      model,
      warranty,
      delivery,
      lastUpdated: new Date()
    };
  }
}
