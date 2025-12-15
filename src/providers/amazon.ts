
import { BasePriceProvider } from './base';
import { AmazonProductData } from '@/types/providers';

export class AmazonProvider extends BasePriceProvider {
  private mockProducts: Record<string, AmazonProductData[]> = {
    'iphone': [
      {
        store: 'Amazon',
        title: 'Apple iPhone 13 128GB - Azul',
        price: 4299.00,
        asin: 'B09G9FPHY6',
        rating: 4.5,
        reviewCount: 1234,
        prime: true,
        sponsored: false,
        url: 'https://amazon.com.br/iphone13-128gb-azul'
      },
      {
        store: 'Amazon',
        title: 'Apple iPhone 13 128GB - Preto',
        price: 4399.00,
        asin: 'B09G9D8KRQ',
        rating: 4.6,
        reviewCount: 2156,
        prime: true,
        sponsored: false,
        url: 'https://amazon.com.br/iphone13-128gb-preto'
      },
      {
        store: 'Amazon',
        title: 'Apple iPhone 13 128GB - Branco',
        price: 4199.00,
        asin: 'B09G9HR5T7',
        rating: 4.4,
        reviewCount: 987,
        prime: false,
        sponsored: true,
        url: 'https://amazon.com.br/iphone13-128gb-branco'
      }
    ],
    'notebook': [
      {
        store: 'Amazon',
        title: 'Dell Inspiron 15 3000 - i5, 8GB RAM, 256GB SSD',
        price: 3299.00,
        asin: 'B08N5WRWNW',
        rating: 4.2,
        reviewCount: 456,
        prime: false,
        sponsored: false,
        url: 'https://amazon.com.br/dell-inspiron-15'
      },
      {
        store: 'Amazon',
        title: 'Acer Aspire 5 - AMD Ryzen 5, 8GB RAM, 512GB SSD',
        price: 2899.00,
        asin: 'B08RZ4L9KQ',
        rating: 4.1,
        reviewCount: 234,
        prime: true,
        sponsored: false,
        url: 'https://amazon.com.br/acer-aspire-5'
      }
    ],
    'tv': [
      {
        store: 'Amazon',
        title: 'Samsung Smart TV 50" 4K UHD',
        price: 2499.00,
        asin: 'B08ZJWLM2Z',
        rating: 4.3,
        reviewCount: 567,
        prime: true,
        sponsored: false,
        url: 'https://amazon.com.br/samsung-tv-50-4k'
      }
    ]
  };

  async search(query: string): Promise<AmazonProductData[]> {
    await this.delay();

    if (this.shouldFail()) {
      throw new Error(`Amazon provider temporarily unavailable for query: ${query}`);
    }

    const normalizedQuery = query.toLowerCase();
    const results: AmazonProductData[] = [];

    for (const [key, products] of Object.entries(this.mockProducts)) {
      if (normalizedQuery.includes(key)) {
        products.forEach(product => {
          results.push({
            ...product,
            store: 'Amazon',
            lastUpdated: new Date(),
            id: this.generateId()
          });
        });
      }
    }

    return results.map(product => ({
      ...product,
      price: product.price! * (0.95 + Math.random() * 0.1)
    }));
  }
}
