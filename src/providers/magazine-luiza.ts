/**
 * Provider real do Magazine Luiza
 * Implementa scraping da página de busca do Magazine Luiza
 * 
 * Estratégia:
 * - Busca na API interna do Magazine Luiza (quando disponível)
 * - Fallback para scraping da página de resultados
 * - Extrai produtos usando seletores CSS específicos
 * - Normaliza preços e URLs
 */

import { load } from 'cheerio';
import { BasePriceProvider } from './base';
import { RawProductData } from '@/types';
import { MagazineLuizaProductData } from '@/types/providers';
import { normalizePrice, cleanText, resolveUrl } from '@/utils/scraping';

export class MagazineLuizaProvider extends BasePriceProvider {
  private readonly searchUrl = 'https://www.magazineluiza.com.br/busca';

  constructor(
    name: string = 'Magazine Luiza',
    baseUrl: string = 'https://www.magazineluiza.com.br',
    timeout: number = 10000,
    maxRetries: number = 2
  ) {
    super(name, baseUrl, timeout, maxRetries, 1200);
  }

  async search(query: string): Promise<RawProductData[]> {
    try {
      await this.delay();

      // Tenta primeiro a API interna (mais rápido e confiável)
      try {
        const apiResults = await this.searchViaAPI(query);
        if (apiResults.length > 0) {
          return apiResults.slice(0, 20);
        }
      } catch (apiError) {
        console.warn(`[Magazine Luiza] API falhou, tentando scraping:`, apiError);
      }

      // Fallback para scraping
      const searchUrl = this.buildSearchUrl(query);
      const response = await this.fetch(searchUrl);

      if (!response.ok) {
        throw new Error(`Magazine Luiza retornou status ${response.status}`);
      }

      const html = await response.text();
      const products = this.parseSearchResults(html, query);

      return products.slice(0, 20);

    } catch (error) {
      console.error(`[Magazine Luiza] Erro ao buscar "${query}":`, error);
      return [];
    }
  }

  /**
   * Tenta buscar via API interna do Magazine Luiza
   * A API geralmente retorna JSON estruturado
   */
  private async searchViaAPI(query: string): Promise<MagazineLuizaProductData[]> {
    const apiUrl = `https://www.magazineluiza.com.br/busca/${encodeURIComponent(query)}`;
    
    const response = await this.fetch(apiUrl, {
      headers: {
        'Accept': 'application/json, text/html, */*',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    // Tenta encontrar JSON na resposta
    const text = await response.text();
    
    // Procura por dados JSON embutidos no HTML (comum em SPAs)
    const jsonMatch = text.match(/window\.__PRELOADED_STATE__\s*=\s*({.+?});/);
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
  private parseAPIResponse(data: Record<string, unknown>): MagazineLuizaProductData[] {
    const products: MagazineLuizaProductData[] = [];

    // Tenta encontrar produtos em diferentes estruturas possíveis
    const productList = ((data.entities as Record<string, unknown>)?.products || 
                       data.products || 
                       (data.search as Record<string, unknown>)?.products ||
                       []) as unknown[];

    for (const item of productList) {
      try {
        const product = this.extractProductFromAPI(item as Record<string, unknown>);
        if (product && this.validateData(product)) {
          products.push(product);
        }
      } catch (error) {
        console.warn(`[Magazine Luiza] Erro ao processar produto da API:`, error);
      }
    }

    return products;
  }

  /**
   * Extrai produto da resposta da API
   */
  private extractProductFromAPI(item: Record<string, unknown>): MagazineLuizaProductData | null {
    const name = (item.name || item.title || item.productName) as string | undefined;
    const price = item.price || item.value || item.salePrice || 
                  (item.priceInfo as Record<string, unknown>)?.price;
    const productId = (item.id || item.productId || item.sku) as string | undefined;
    const url = (item.url || item.link || item.productUrl) as string | undefined;

    if (!name || !price || !url) {
      return null;
    }

    const normalizedPrice = typeof price === 'number' ? price : normalizePrice(String(price));
    if (!normalizedPrice || normalizedPrice <= 0) {
      return null;
    }

    return {
      store: 'Magazine Luiza',
      name,
      title: name,
      value: normalizedPrice,
      price: normalizedPrice,
      url: resolveUrl(this.baseUrl!, url),
      productId: String(productId),
      category: (item.category || item.categoryName) as string | undefined,
      brand: (item.brand || item.brandName) as string | undefined,
      installment: item.installment ? {
        count: ((item.installment as Record<string, unknown>).count || (item.installment as Record<string, unknown>).installmentCount || 0) as number,
        value: ((item.installment as Record<string, unknown>).value || (item.installment as Record<string, unknown>).installmentValue || 0) as number
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
  private parseSearchResults(html: string, query: string): MagazineLuizaProductData[] {
    const $ = load(html);
    const products: MagazineLuizaProductData[] = [];

    // Seletores para produtos no Magazine Luiza
    const productSelectors = [
      '[data-testid="product-card"]',
      '.product-card',
      '[data-product-id]',
      '.productShowCase',
      'li[data-testid="product"]'
    ];

    let productElements = $('');

    for (const selector of productSelectors) {
      productElements = $(selector);
      if (productElements.length > 0) {
        break;
      }
    }

    if (productElements.length === 0) {
      console.warn(`[Magazine Luiza] Nenhum produto encontrado para "${query}"`);
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
        console.warn(`[Magazine Luiza] Erro ao extrair produto:`, error);
      }
    });

    return products;
  }

  /**
   * Extrai dados de um produto individual do HTML
   */
  private extractProductData(
    $element: ReturnType<ReturnType<typeof load>>
  ): MagazineLuizaProductData | null {
    // Extrai ID do produto
    const productId = $element.attr('data-product-id') ||
                     $element.attr('data-testid')?.replace('product-card-', '') ||
                     $element.find('[data-product-id]').first().attr('data-product-id') ||
                     null;

    // Extrai nome/título
    const nameSelectors = [
      '[data-testid="product-title"]',
      '.product-title',
      'h2 a',
      'h3 a',
      '.product-name',
      'a[data-testid="product-link"]'
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
      '.price-current'
    ];

    let priceText = '';
    for (const selector of priceSelectors) {
      priceText = cleanText($element.find(selector).first().text());
      if (priceText) break;
    }

    // Se não encontrou, tenta buscar por padrão de preço
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
      '.product-link'
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

    // Extrai categoria (opcional)
    const category = cleanText($element.find('[data-testid="product-category"]').first().text()) ||
                    cleanText($element.find('.product-category').first().text()) ||
                    undefined;

    // Extrai marca (opcional)
    const brand = cleanText($element.find('[data-testid="product-brand"]').first().text()) ||
                 cleanText($element.find('.product-brand').first().text()) ||
                 undefined;

    // Extrai informações de parcelamento (opcional)
    const installmentText = cleanText($element.find('[data-testid="installment"]').first().text()) ||
                           cleanText($element.find('.installment').first().text()) ||
                           '';
    
    let installment;
    if (installmentText) {
      const installmentMatch = installmentText.match(/(\d+)\s*x\s*de\s*R\$\s*([\d.,]+)/i);
      if (installmentMatch) {
        installment = {
          count: parseInt(installmentMatch[1]),
          value: normalizePrice(installmentMatch[2]) || 0
        };
      }
    }

    return {
      store: 'Magazine Luiza',
      name,
      title: name,
      value: price,
      price,
      url: productUrl,
      productId: productId || this.generateId('ML'),
      category,
      brand,
      installment,
      lastUpdated: new Date()
    };
  }
}
