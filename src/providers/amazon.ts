/**
 * Provider real da Amazon Brasil
 * Implementa scraping da página de busca da Amazon
 * 
 * Estratégia:
 * - Busca na página de resultados da Amazon
 * - Extrai produtos usando seletores CSS específicos
 * - Normaliza preços e URLs
 * - Trata casos de produtos sem preço ou indisponíveis
 */

import { load } from 'cheerio';
import { BasePriceProvider } from './base';
import { RawProductData } from '@/types';
import { AmazonProductData } from '@/types/providers';
import { normalizePrice, cleanText, resolveUrl } from '@/utils/scraping';

export class AmazonProvider extends BasePriceProvider {
  private readonly searchUrl = 'https://www.amazon.com.br/s';

  constructor(
    name: string = 'Amazon',
    baseUrl: string = 'https://www.amazon.com.br',
    timeout: number = 12000,
    maxRetries: number = 2
  ) {
    super(name, baseUrl, timeout, maxRetries, 1500);
  }

  async search(query: string): Promise<RawProductData[]> {
    try {
      // Delay inicial para evitar rate limiting
      await this.delay();

      const searchUrl = this.buildSearchUrl(query);
      const response = await this.fetch(searchUrl);

      if (!response.ok) {
        throw new Error(`Amazon retornou status ${response.status}`);
      }

      const html = await response.text();
      const products = this.parseSearchResults(html, query);

      return products.slice(0, 20); // Limita a 20 resultados

    } catch (error) {
      console.error(`[Amazon] Erro ao buscar "${query}":`, error);
      // Retorna array vazio em caso de erro - não quebra o sistema
      return [];
    }
  }

  /**
   * Constrói URL de busca da Amazon
   */
  private buildSearchUrl(query: string): string {
    const params = new URLSearchParams({
      k: query,
      i: 'aps', // All Products
      ref: 'sr_pg_1'
    });

    return `${this.searchUrl}?${params.toString()}`;
  }

  /**
   * Faz parse do HTML da página de resultados
   * Usa múltiplos seletores para maior robustez
   */
  private parseSearchResults(html: string, query: string): AmazonProductData[] {
    const $ = load(html);
    const products: AmazonProductData[] = [];

    // Seletores possíveis para produtos na Amazon
    // A Amazon muda frequentemente a estrutura, então usamos múltiplos seletores
    const productSelectors = [
      '[data-component-type="s-search-result"]',
      '.s-result-item[data-asin]',
      '.s-result-item',
      '[data-asin]:not([data-asin=""])'
    ];

    let productElements = $('');

    for (const selector of productSelectors) {
      productElements = $(selector);
      if (productElements.length > 0) {
        break;
      }
    }

    if (productElements.length === 0) {
      console.warn(`[Amazon] Nenhum produto encontrado com os seletores padrão para "${query}"`);
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
        console.warn(`[Amazon] Erro ao extrair produto:`, error);
        // Continua processando outros produtos
      }
    });

    return products;
  }

  /**
   * Extrai dados de um produto individual
   */
  private extractProductData(
    $element: ReturnType<ReturnType<typeof load>>
  ): AmazonProductData | null {
    // Extrai ASIN (Amazon Standard Identification Number)
    const asin = $element.attr('data-asin') || 
                 $element.find('[data-asin]').first().attr('data-asin') || 
                 null;

    if (!asin || asin === '') {
      return null; // Produto sem ASIN geralmente não é válido
    }

    // Extrai título/nome do produto
    const titleSelectors = [
      'h2 a span',
      'h2 span',
      '.s-title-instructions-style h2 a',
      '[data-cy="title-recipe"] a',
      'a.a-link-normal span.a-text-normal'
    ];

    let title = '';
    for (const selector of titleSelectors) {
      title = cleanText($element.find(selector).first().text());
      if (title) break;
    }

    if (!title) {
      return null;
    }

    // Extrai preço
    const priceSelectors = [
      '.a-price-whole',
      '.a-price .a-offscreen',
      '.a-price[data-a-color="price"] .a-offscreen',
      '[data-a-color="price"] .a-offscreen',
      '.a-price-symbol + .a-price-whole',
      '.a-price-range .a-offscreen'
    ];

    let priceText = '';
    for (const selector of priceSelectors) {
      const priceElement = $element.find(selector).first();
      priceText = priceElement.text() || priceElement.attr('aria-label') || '';
      
      if (priceText) {
        // Se encontrou preço parcial, tenta completar com símbolo e centavos
        const symbol = $element.find('.a-price-symbol').first().text() || 'R$';
        const fraction = $element.find('.a-price-fraction').first().text() || '';
        if (fraction && !priceText.includes(',')) {
          priceText = `${symbol} ${priceText},${fraction}`;
        }
        break;
      }
    }

    // Se não encontrou preço nos seletores, tenta buscar texto completo
    if (!priceText) {
      const priceContainer = $element.find('.a-price, [data-a-color="price"]').first();
      priceText = cleanText(priceContainer.text());
    }

    const price = normalizePrice(priceText);
    if (!price || price <= 0) {
      return null; // Produto sem preço válido
    }

    // Extrai URL do produto
    const linkSelectors = [
      'h2 a',
      'a.a-link-normal[href*="/dp/"]',
      'a[href*="/dp/"]',
      'a[href*="/gp/product/"]'
    ];

    let productUrl = '';
    for (const selector of linkSelectors) {
      const href = $element.find(selector).first().attr('href');
      if (href) {
        productUrl = resolveUrl(this.baseUrl!, href);
        break;
      }
    }

    if (!productUrl || !productUrl.includes('/dp/')) {
      return null; // URL inválida
    }

    // Extrai rating (opcional)
    const ratingText = $element.find('.a-icon-alt').first().text() || '';
    const ratingMatch = ratingText.match(/(\d+[.,]\d+)/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : undefined;

    // Extrai número de avaliações (opcional)
    const reviewsText = $element.find('a.a-link-normal .a-size-base').first().text() || '';
    const reviewsMatch = reviewsText.match(/([\d.]+)/);
    const reviewCount = reviewsMatch ? parseInt(reviewsMatch[1].replace(/\./g, '')) : undefined;

    // Verifica se é Prime
    const isPrime = $element.find('.s-prime').length > 0 || 
                    $element.text().toLowerCase().includes('prime');

    // Verifica se é patrocinado
    const isSponsored = $element.find('[data-component-type="sp-sponsored-result"]').length > 0 ||
                        $element.text().toLowerCase().includes('patrocinado');

    return {
      store: 'Amazon',
      title,
      name: title, // Compatibilidade
      price,
      url: productUrl,
      asin,
      rating,
      reviewCount,
      prime: isPrime,
      sponsored: isSponsored,
      lastUpdated: new Date()
    };
  }
}
