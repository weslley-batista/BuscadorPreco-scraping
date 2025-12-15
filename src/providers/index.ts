
export { AmazonProvider } from './amazon';
export { MagazineLuizaProvider } from './magazine-luiza';
export { CasasBahiaProvider } from './casas-bahia';
export { BasePriceProvider } from './base';

import { AmazonProvider } from './amazon';
import { MagazineLuizaProvider } from './magazine-luiza';
import { CasasBahiaProvider } from './casas-bahia';
import { PriceProvider, ProviderRegistry } from '@/types';

export const providerRegistry: ProviderRegistry = {
  amazon: {
    factory: () => new AmazonProvider('Amazon', 'https://amazon.com.br'),
    config: {
      name: 'Amazon',
      enabled: true,
      priority: 1,
      timeout: 5000,
      maxRetries: 2,
      weight: 1.0
    }
  },
  'magazine-luiza': {
    factory: () => new MagazineLuizaProvider('Magazine Luiza', 'https://magazinevoce.com.br'),
    config: {
      name: 'Magazine Luiza',
      enabled: true,
      priority: 2,
      timeout: 5000,
      maxRetries: 2,
      weight: 1.0
    }
  },
  'casas-bahia': {
    factory: () => new CasasBahiaProvider('Casas Bahia', 'https://casasbahia.com.br'),
    config: {
      name: 'Casas Bahia',
      enabled: true,
      priority: 3,
      timeout: 5000,
      maxRetries: 2,
      weight: 1.0
    }
  }
};

export function getEnabledProviders(): PriceProvider[] {
  return Object.values(providerRegistry)
    .filter(({ config }) => config.enabled)
    .sort((a, b) => a.config.priority - b.config.priority)
    .map(({ factory, config }) => factory(config));
}

export function getProviderByName(name: string): PriceProvider | null {
  const entry = providerRegistry[name];
  return entry ? entry.factory(entry.config) : null;
}
