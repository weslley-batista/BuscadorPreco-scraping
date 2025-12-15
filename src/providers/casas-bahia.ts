
import { BasePriceProvider } from './base';
import { CasasBahiaProductData } from '@/types/providers';

export class CasasBahiaProvider extends BasePriceProvider {
  private mockProducts: Record<string, CasasBahiaProductData[]> = {
    'iphone': [
      {
        store: 'Casas Bahia',
        name: 'iPhone 13 Apple 128GB Azul - Garantia Estendida',
        cost: 4799.00,
        sku: 'CB-56789',
        model: 'iPhone 13',
        warranty: '12 meses',
        delivery: {
          free: true,
          estimatedDays: 3
        },
        url: 'https://casasbahia.com.br/iphone13-128gb-azul'
      },
      {
        store: 'Casas Bahia',
        name: 'iPhone 13 Apple 128GB Preto - Com Fone de Ouvido',
        cost: 4899.00,
        sku: 'CB-56790',
        model: 'iPhone 13',
        warranty: '24 meses',
        delivery: {
          free: false,
          estimatedDays: 5
        },
        url: 'https://casasbahia.com.br/iphone13-128gb-preto'
      },
      {
        store: 'Casas Bahia',
        name: 'iPhone 13 Apple 128GB Branco - Kit Completo',
        cost: 4699.00,
        sku: 'CB-56791',
        model: 'iPhone 13',
        warranty: '12 meses',
        delivery: {
          free: true,
          estimatedDays: 2
        },
        url: 'https://casasbahia.com.br/iphone13-128gb-branco'
      }
    ],
    'notebook': [
      {
        store: 'Casas Bahia',
        name: 'Notebook Dell Inspiron 15 3000 i5 8GB 256GB SSD',
        cost: 3699.00,
        sku: 'CB-67890',
        model: 'Inspiron 15 3000',
        warranty: '12 meses',
        delivery: {
          free: true,
          estimatedDays: 4
        },
        url: 'https://casasbahia.com.br/dell-inspiron-15'
      },
      {
        store: 'Casas Bahia',
        name: 'Notebook Acer Aspire 5 Ryzen 5 8GB 512GB SSD',
        cost: 3399.00,
        sku: 'CB-67891',
        model: 'Aspire 5',
        warranty: '24 meses',
        delivery: {
          free: false,
          estimatedDays: 7
        },
        url: 'https://casasbahia.com.br/acer-aspire-5'
      }
    ],
    'tv': [
      {
        store: 'Casas Bahia',
        name: 'Smart TV Samsung 50" UHD 4K LED - Entrega Imediata',
        cost: 2999.00,
        sku: 'CB-78901',
        model: 'Samsung 50" 4K',
        warranty: '36 meses',
        delivery: {
          free: true,
          estimatedDays: 1
        },
        url: 'https://casasbahia.com.br/samsung-tv-50-4k'
      }
    ]
  };

  async search(query: string): Promise<CasasBahiaProductData[]> {
    await this.delay();

    if (this.shouldFail()) {
      throw new Error(`Casas Bahia provider temporarily unavailable for query: ${query}`);
    }

    const normalizedQuery = query.toLowerCase();
    const results: CasasBahiaProductData[] = [];

    for (const [key, products] of Object.entries(this.mockProducts)) {
      if (normalizedQuery.includes(key)) {
        products.forEach(product => {
          results.push({
            ...product,
            store: 'Casas Bahia',
            lastUpdated: new Date(),
            id: this.generateId()
          });
        });
      }
    }

    return results.map(product => ({
      ...product,
      cost: product.cost! * (0.9 + Math.random() * 0.2)
    }));
  }
}
