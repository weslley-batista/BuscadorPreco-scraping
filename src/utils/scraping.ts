/**
 * Utilitários para scraping web
 * Fornece headers realistas, delays, rate limiting e tratamento de erros
 */

export interface ScrapingConfig {
  timeout?: number;
  retries?: number;
  delay?: number;
  userAgent?: string;
}

export interface ScrapingHeaders {
  'User-Agent': string;
  'Accept': string;
  'Accept-Language': string;
  'Accept-Encoding': string;
  'Connection': string;
  'Upgrade-Insecure-Requests': string;
  'Sec-Fetch-Dest'?: string;
  'Sec-Fetch-Mode'?: string;
  'Sec-Fetch-Site'?: string;
  'Cache-Control'?: string;
  'Referer'?: string;
}

/**
 * Gera headers realistas para requisições HTTP
 * Simula um navegador real para evitar bloqueios básicos
 */
export function getRealisticHeaders(referer?: string): ScrapingHeaders {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
  ];

  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

  const headers: ScrapingHeaders = {
    'User-Agent': randomUserAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': referer ? 'same-origin' : 'none',
    'Cache-Control': 'max-age=0'
  };

  if (referer) {
    headers['Referer'] = referer;
  }

  return headers;
}

/**
 * Delay aleatório entre requisições para evitar rate limiting
 * @param minMs Tempo mínimo em milissegundos (padrão: 500ms)
 * @param maxMs Tempo máximo em milissegundos (padrão: 2000ms)
 */
export function randomDelay(minMs: number = 500, maxMs: number = 2000): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Delay fixo entre requisições
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Faz uma requisição HTTP com timeout e retry
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  config: ScrapingConfig = {}
): Promise<Response> {
  const {
    timeout = 10000,
    retries = 2,
    delay: delayMs = 1000
  } = config;

  const referer = typeof options.headers === 'object' && 
                  !(options.headers instanceof Headers) && 
                  !Array.isArray(options.headers) 
                  ? (options.headers as Record<string, string>).referer 
                  : undefined;
  
  const headers = {
    ...getRealisticHeaders(referer),
    ...(typeof options.headers === 'object' && 
        !(options.headers instanceof Headers) && 
        !Array.isArray(options.headers) 
        ? options.headers 
        : {})
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        await delay(delayMs * attempt); // Backoff exponencial
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === retries) {
        break;
      }

      // Não retry em caso de timeout ou abort
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('timeout'))) {
        throw new Error(`Timeout após ${timeout}ms: ${url}`);
      }
    }
  }

  throw lastError || new Error(`Falha após ${retries + 1} tentativas`);
}

/**
 * Normaliza preço de string para número
 * Trata formatos brasileiros: R$ 1.234,56 ou 1234.56
 */
export function normalizePrice(priceString: string): number | null {
  if (!priceString || typeof priceString !== 'string') {
    return null;
  }

  // Remove símbolos de moeda e espaços
  let cleaned = priceString
    .replace(/R\$/gi, '')
    .replace(/[^\d.,]/g, '')
    .trim();

  if (!cleaned) {
    return null;
  }

  // Detecta formato brasileiro (vírgula como decimal)
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  if (hasComma && hasDot) {
    // Formato: 1.234,56 ou 1,234.56
    // Assume que o último separador é o decimal
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');

    if (lastComma > lastDot) {
      // Formato brasileiro: 1.234,56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato americano: 1,234.56
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Apenas vírgula - pode ser decimal ou milhar
    // Se tiver mais de 3 dígitos após vírgula, assume que é milhar
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      cleaned = cleaned.replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (hasDot) {
    // Apenas ponto - pode ser decimal ou milhar
    const parts = cleaned.split('.');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Assume decimal
      cleaned = cleaned;
    } else {
      // Assume milhar
      cleaned = cleaned.replace(/\./g, '');
    }
  }

  const price = parseFloat(cleaned);
  return isNaN(price) || price <= 0 ? null : Math.round(price * 100) / 100;
}

/**
 * Limpa e normaliza texto extraído do HTML
 */
export function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n/g, ' ')
    .trim();
}

/**
 * Extrai URL absoluta de uma URL relativa
 */
export function resolveUrl(baseUrl: string, relativeUrl: string): string {
  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch {
    return relativeUrl.startsWith('http') ? relativeUrl : `${baseUrl}${relativeUrl}`;
  }
}

/**
 * Rate limiter simples por domínio
 */
class RateLimiter {
  private lastRequest: Map<string, number> = new Map();
  private minDelay: number;

  constructor(minDelayMs: number = 1000) {
    this.minDelay = minDelayMs;
  }

  async waitForDomain(domain: string): Promise<void> {
    const last = this.lastRequest.get(domain) || 0;
    const now = Date.now();
    const elapsed = now - last;

    if (elapsed < this.minDelay) {
      await delay(this.minDelay - elapsed);
    }

    this.lastRequest.set(domain, Date.now());
  }
}

export const rateLimiter = new RateLimiter(1000); // 1 segundo mínimo entre requisições do mesmo domínio

