
import { PriceProvider, RawProductData } from '@/types';

export abstract class BasePriceProvider implements PriceProvider {
  constructor(
    public readonly name: string,
    protected readonly baseUrl?: string,
    protected readonly timeout: number = 5000
  ) {}

  abstract search(query: string): Promise<RawProductData[]>;

  protected delay(ms: number = Math.random() * 2000 + 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected generateId(): string {
    return `${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected formatUrl(path: string): string {
    return this.baseUrl ? `${this.baseUrl}${path}` : path;
  }

  protected shouldFail(): boolean {
    return Math.random() < 0.1; // 10% de chance de falha
  }

  protected validateData(data: RawProductData): boolean {
    return !!(data.name || data.title) && typeof data.price === 'number' && data.price > 0;
  }
}
