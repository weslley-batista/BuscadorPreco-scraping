
import { BasePriceProvider } from './base';
import { MagazineLuizaProductData } from '@/types/providers';

export class MagazineLuizaProvider extends BasePriceProvider {
  private mockProducts: Record<string, MagazineLuizaProductData[]> = {
    'iphone': [
      {
        store: 'Magazine Luiza',
        name: 'iPhone 13 Apple 128GB Azul - Distribuidor Autorizado',
        value: 4599.00,
        productId: 'ML-12345',
        category: 'Smartphones',
        brand: 'Apple',
        installment: {
          count: 10,
          value: 459.90
        },
        url: 'https://magazinevoce.com.br/iphone13-128gb-azul'
      },
      {
        store: 'Magazine Luiza',
        name: 'iPhone 13 Apple 128GB Preto - Distribuidor Autorizado',
        value: 4699.00,
        productId: 'ML-12346',
        category: 'Smartphones',
        brand: 'Apple',
        installment: {
          count: 12,
          value: 391.58
        },
        url: 'https://magazinevoce.com.br/iphone13-128gb-preto'
      },
      {
        store: 'Magazine Luiza',
        name: 'iPhone 13 Apple 128GB Branco - Distribuidor Autorizado',
        value: 4499.00,
        productId: 'ML-12347',
        category: 'Smartphones',
        brand: 'Apple',
        installment: {
          count: 10,
          value: 449.90
        },
        url: 'https://magazinevoce.com.br/iphone13-128gb-branco'
      }
    ],
    'notebook': [
      {
        store: 'Magazine Luiza',
        name: 'Notebook Dell Inspiron 15 3000 i5 8GB 256GB SSD',
        value: 3499.00,
        productId: 'ML-23456',
        category: 'Notebooks',
        brand: 'Dell',
        installment: {
          count: 10,
          value: 349.90
        },
        url: 'https://magazinevoce.com.br/dell-inspiron-15'
      },
      {
        store: 'Magazine Luiza',
        name: 'Notebook Acer Aspire 5 Ryzen 5 8GB 512GB SSD',
        value: 3199.00,
        productId: 'ML-23457',
        category: 'Notebooks',
        brand: 'Acer',
        installment: {
          count: 12,
          value: 266.58
        },
        url: 'https://magazinevoce.com.br/acer-aspire-5'
      }
    ],
    'tv': [
      {
        store: 'Magazine Luiza',
        name: 'Smart TV Samsung 50" UHD 4K LED',
        value: 2799.00,
        productId: 'ML-34567',
        category: 'Televisores',
        brand: 'Samsung',
        installment: {
          count: 10,
          value: 279.90
        },
        url: 'https://magazinevoce.com.br/samsung-tv-50-4k'
      }
    ]
  };

  async search(query: string): Promise<MagazineLuizaProductData[]> {
    await this.delay();

    if (this.shouldFail()) {
      throw new Error(`Magazine Luiza provider temporarily unavailable for query: ${query}`);
    }

    const normalizedQuery = query.toLowerCase();
    const results: MagazineLuizaProductData[] = [];

    for (const [key, products] of Object.entries(this.mockProducts)) {
      if (normalizedQuery.includes(key)) {
        products.forEach(product => {
          results.push({
            ...product,
            store: 'Magazine Luiza',
            lastUpdated: new Date(),
            id: this.generateId()
          });
        });
      }
    }

    return results.map(product => ({
      ...product,
      value: product.value! * (0.93 + Math.random() * 0.14)
    }));
  }
}
