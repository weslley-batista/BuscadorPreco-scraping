# 🛒 Buscador de Preços

Um buscador de preços similar ao Google Shopping, desenvolvido em Next.js 14 com TypeScript. Permite comparar preços de produtos em múltiplas lojas online simultaneamente.

## 🚀 Funcionalidades

- **Busca Real de Preços**: Scraping real das lojas online (Amazon, Magazine Luiza, Casas Bahia)
- **Comparação Multi-loja**: Busca simultânea em múltiplas lojas
- **Ordenação Inteligente**: Resultados ordenados por menor preço
- **Filtros Avançados**: Por loja e faixa de preço
- **Interface Responsiva**: Funciona perfeitamente em desktop e mobile
- **Cache Inteligente**: Resultados em cache para melhor performance (TTL: 5 minutos)
- **Debounce Automático**: Busca otimizada com debounce de 500ms
- **Tratamento de Erros Robusto**: Fallback gracioso - se uma loja falhar, as outras continuam funcionando
- **Rate Limiting**: Delays automáticos entre requisições para evitar bloqueios
- **Headers Realistas**: User-Agents rotacionados para simular navegador real
- **Retry com Backoff**: Tentativas automáticas em caso de falha temporária

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: API Routes do Next.js
- **Scraping**: Cheerio para parsing HTML, Fetch API com retry e timeout
- **Ícones**: Lucide React
- **Linting**: ESLint
- **Build**: Turbopack

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── api/search/          # API de busca
│   ├── layout.tsx           # Layout da aplicação
│   ├── page.tsx             # Página principal
│   └── globals.css          # Estilos globais
├── components/              # Componentes React
│   ├── SearchBar.tsx        # Barra de busca
│   ├── ProductCard.tsx      # Card de produto
│   ├── SearchResults.tsx    # Resultados da busca
│   └── SearchFilters.tsx    # Filtros de busca
├── hooks/                   # Hooks customizados
│   ├── useSearch.ts         # Hook para busca
│   └── useDebounce.ts       # Hook para debounce
├── providers/               # Providers de dados (scraping real)
│   ├── amazon.ts            # Provider Amazon (scraping)
│   ├── magazine-luiza.ts    # Provider Magazine Luiza (API + scraping)
│   ├── casas-bahia.ts       # Provider Casas Bahia (API + scraping)
│   └── base.ts              # Provider base abstrato
├── services/                # Serviços da aplicação
│   ├── search.ts            # Serviço de busca
│   ├── normalizer.ts        # Normalização de dados
│   └── cache.ts             # Cache em memória
├── utils/                   # Utilitários
│   └── scraping.ts          # Funções de scraping (headers, delays, rate limiting)
└── types/                   # Definições TypeScript
    ├── index.ts             # Tipos principais
    └── providers.ts         # Tipos específicos de providers
```

## 🏃‍♂️ Como Executar

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Executar em modo desenvolvimento**:
   ```bash
   npm run dev
   ```

3. **Acessar**: http://localhost:3000

4. **Build para produção**:
   ```bash
   npm run build
   npm start
   ```

## 🔍 Como Usar

1. Digite o nome do produto na barra de busca (ex: "iPhone 13", "notebook dell")
2. Aguarde os resultados aparecerem automaticamente (debounce de 500ms)
3. Use os filtros para refinar por loja ou faixa de preço
4. Clique em "Ver na Loja" para acessar o produto

## 🏗️ Arquitetura

### Fluxo de Execução

1. **Usuário busca** → Interface registra query
2. **Debounce** → Evita buscas excessivas (500ms)
3. **API Call** → GET/POST para `/api/search`
4. **Consultas Paralelas** → Busca simultânea em todos os providers
5. **Normalização** → Unifica formatos diferentes dos providers
6. **Ordenação** → Por menor preço
7. **Cache** → Resultados armazenados por 5 minutos
8. **Resposta** → JSON estruturado para o frontend

### Providers

Cada provider implementa scraping real das lojas:

- **Amazon**: Scraping da página de resultados, extrai `price`, `asin`, `rating`, `prime`
- **Magazine Luiza**: Tenta API interna primeiro, fallback para scraping, extrai `value`, `productId`, `installment`
- **Casas Bahia**: Tenta API interna primeiro, fallback para scraping, extrai `cost`, `sku`, `warranty`, `delivery`

**Características dos Providers**:
- ✅ Múltiplos seletores CSS para maior robustez
- ✅ Tratamento de erros individual (não quebra o sistema)
- ✅ Timeout configurável por provider
- ✅ Retry automático com backoff exponencial
- ✅ Rate limiting por domínio
- ✅ Headers realistas com User-Agent rotacionado

### Cache Strategy

- **TTL**: 5 minutos por padrão
- **Chave**: Baseada em query + filtros
- **Storage**: Memória (reinicia com app)

## 📊 API

### GET /api/search

Busca produtos com parâmetros de query string.

**Parâmetros**:
- `q` (obrigatório): Termo de busca
- `stores`: Lojas específicas (ex: "amazon,magazine-luiza")
- `minPrice`: Preço mínimo
- `maxPrice`: Preço máximo
- `maxResults`: Número máximo de resultados
- `timeout`: Timeout em ms (padrão: 10000)

**Exemplo**:
```bash
GET /api/search?q=iphone&stores=amazon&minPrice=4000&maxPrice=5000
```

**Resposta**:
```json
{
  "results": [
    {
      "id": "amazon-iphone-123",
      "name": "iPhone 13 128GB",
      "price": 4299.00,
      "store": "Amazon",
      "url": "https://amazon.com.br/iphone13",
      "lastUpdated": "2024-01-15T10:30:00.000Z",
      "currency": "BRL"
    }
  ],
  "totalResults": 1,
  "searchTime": 1250,
  "query": "iphone",
  "filters": {
    "stores": ["amazon"],
    "minPrice": 4000,
    "maxPrice": 5000
  }
}
```

### POST /api/search

Busca com corpo JSON (útil para filtros complexos).

**Corpo**:
```json
{
  "query": "notebook dell",
  "filters": {
    "stores": ["amazon", "magazine-luiza"],
    "minPrice": 2000,
    "maxPrice": 4000
  },
  "config": {
    "maxResults": 20,
    "timeout": 15000
  }
}
```

## 🎯 Diferenciais Implementados

- ✅ **Scraping Real**: Busca preços reais das lojas online
- ✅ **Cache em memória** com TTL configurável (5 minutos)
- ✅ **Indicador de "melhor oferta"** com destaque visual
- ✅ **Debounce na busca** (500ms) para melhor UX
- ✅ **Tratamento de erro robusto** por provider (fallback gracioso)
- ✅ **AbortController** para cancelar buscas antigas
- ✅ **Rate Limiting**: Delays automáticos entre requisições
- ✅ **Retry com Backoff**: Tentativas automáticas em caso de falha
- ✅ **Headers Realistas**: User-Agents rotacionados
- ✅ **Normalização de Preços**: Suporta formatos brasileiros (R$ 1.234,56)
- ✅ **Execução Paralela**: Busca simultânea em todas as lojas
- ✅ **Timeout Individual**: Cada provider tem seu próprio timeout

## ⚙️ Configuração

Veja o arquivo `CONFIG.md` para detalhes sobre variáveis de ambiente e configurações avançadas.

Principais configurações disponíveis:
- Timeouts por provider
- Número de retries
- Delays entre requisições
- TTL do cache
- Nível de logs

## 🔮 Expansão Futura

- ✅ ~~Integração com APIs reais das lojas~~ (Implementado)
- ✅ ~~Implementação de scraping~~ (Implementado)
- 🔄 Integração com Mercado Livre
- 🔄 Banco de dados para histórico de preços
- 🔄 Notificações de queda de preço
- 🔄 Autenticação de usuários
- 🔄 Favoritos e listas de desejos
- 🔄 Comparação histórica de preços
- 🔄 Suporte a proxies/rotating IPs
- 🔄 Playwright para sites com JavaScript pesado

## 📝 Licença

Este projeto é apenas para fins educacionais e de demonstração.

---

Desenvolvido com ❤️ usando Next.js e TypeScript