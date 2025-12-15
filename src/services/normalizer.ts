
import { RawProductData, ProductResult, DEFAULT_CURRENCY } from '@/types';
import { AmazonProductData, MagazineLuizaProductData, CasasBahiaProductData } from '@/types/providers';

export class DataNormalizer {
  normalize(rawData: RawProductData): ProductResult | null {
    try {
      if (!this.isValidData(rawData)) {
        return null;
      }

      const name = this.extractName(rawData);
      const price = this.extractPrice(rawData);
      const url = this.extractUrl(rawData);
      const lastUpdated = this.extractLastUpdated(rawData);

      if (!name || !price || !url) {
        return null;
      }

      return {
        id: (typeof rawData.id === 'string' ? rawData.id : this.generateId(rawData)),
        name,
        price: Math.round(price * 100) / 100, // Arredonda para 2 casas decimais
        store: rawData.store,
        url,
        lastUpdated,
        currency: DEFAULT_CURRENCY
      };
    } catch (error) {
      console.error('Erro ao normalizar dados:', error, rawData);
      return null;
    }
  }

  normalizeList(rawDataList: RawProductData[]): ProductResult[] {
    return rawDataList
      .map(data => this.normalize(data))
      .filter((result): result is ProductResult => result !== null);
  }

  private isValidData(data: RawProductData): boolean {
    const hasName = !!(data.name || data.title);
    const hasPrice = this.extractPrice(data) !== null;
    const hasStore = !!data.store;
    const hasUrl = this.extractUrl(data) !== null;

    return hasName && hasPrice && hasStore && hasUrl;
  }

  private extractName(data: RawProductData): string | null {
    return data.name || data.title || null;
  }

  private extractPrice(data: RawProductData): number | null {
    const price = data.price ?? data.value ?? data.cost;

    if (typeof price === 'number' && price > 0) {
      return price;
    }

    if (typeof price === 'string') {
      const stringPrice = price as string;
      const cleanedPrice = stringPrice.replace(/[^\d.,]/g, '').replace(',', '.');
      const parsedPrice = parseFloat(cleanedPrice);
      return isNaN(parsedPrice) ? null : parsedPrice;
    }

    return null;
  }

  private extractUrl(data: RawProductData): string | null {
    const url = data.url || data.link || data.href;

    if (typeof url === 'string' && url.trim()) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
      }
      return url;
    }

    return null;
  }

  private extractLastUpdated(data: RawProductData): Date {
    if (data.lastUpdated instanceof Date) {
      return data.lastUpdated;
    }

    if (typeof data.lastUpdated === 'string') {
      const parsed = new Date(data.lastUpdated);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return new Date();
  }

  private generateId(data: RawProductData): string {
    const base = `${data.store}-${data.name || data.title || 'unknown'}-${Date.now()}`;
    return base.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  }

  normalizeAmazonData(data: AmazonProductData): ProductResult | null {
    return this.normalize(data);
  }

  normalizeMagazineLuizaData(data: MagazineLuizaProductData): ProductResult | null {
    return this.normalize(data);
  }

  normalizeCasasBahiaData(data: CasasBahiaProductData): ProductResult | null {
    return this.normalize(data);
  }
}

export const dataNormalizer = new DataNormalizer();
