# 🛒 Buscador de Preços

Um buscador de preços similar ao Google Shopping, desenvolvido em Next.js 14 com TypeScript. Permite comparar preços de produtos em múltiplas lojas online simultaneamente.

## 🚀 Funcionalidades

- **Busca Instantânea**: Busque produtos e veja preços em tempo real
- **Comparação Multi-loja**: Amazon, Magazine Luiza e Casas Bahia
- **Ordenação Inteligente**: Resultados ordenados por menor preço
- **Filtros Avançados**: Por loja e faixa de preço
- **Interface Responsiva**: Funciona perfeitamente em desktop e mobile
- **Cache Inteligente**: Resultados em cache para melhor performance
- **Debounce Automático**: Busca otimizada com debounce de 500ms
- **Tratamento de Erros**: Fallback gracioso para falhas de providers

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: API Routes do Next.js
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
├── providers/               # Providers de dados (mockados)
│   ├── amazon.ts            # Provider Amazon
│   ├── magazine-luiza.ts    # Provider Magazine Luiza
│   ├── casas-bahia.ts       # Provider Casas Bahia
│   └── base.ts              # Provider base abstrato
├── services/                # Serviços da aplicação
│   ├── search.ts            # Serviço de busca
│   ├── normalizer.ts        # Normalização de dados
│   └── cache.ts             # Cache em memória
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

Cada provider simula uma loja real com dados mockados:

- **Amazon**: Usa campos como `price`, `asin`, `rating`
- **Magazine Luiza**: Usa `value`, `productId`, `installment`
- **Casas Bahia**: Usa `cost`, `sku`, `warranty`, `delivery`

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

- ✅ **Cache em memória** com TTL configurável
- ✅ **Indicador de "melhor oferta"** com destaque visual
- ✅ **Debounce na busca** (500ms) para melhor UX
- ✅ **Tratamento de erro** por provider (fallback gracioso)
- ✅ **AbortController** para cancelar buscas antigas
- ✅ **Arquitetura preparada** para scraping/APIs reais

## 🔮 Expansão Futura

- Integração com APIs reais das lojas
- Implementação de scraping com Puppeteer/Playwright
- Banco de dados para histórico de preços
- Notificações de queda de preço
- Autenticação de usuários
- Favoritos e listas de desejos
- Comparação histórica de preços

## 📝 Licença

Este projeto é apenas para fins educacionais e de demonstração.

---

Desenvolvido com ❤️ usando Next.js e TypeScript