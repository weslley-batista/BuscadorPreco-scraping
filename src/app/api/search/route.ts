
import { NextRequest, NextResponse } from 'next/server';
import { searchService } from '@/services';
import { SearchConfig, SearchFilters, SEARCH_TIMEOUT } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('q');
    const stores = searchParams.get('stores')?.split(',').filter(Boolean);
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const maxResults = searchParams.get('maxResults') ? parseInt(searchParams.get('maxResults')!) : undefined;
    const timeout = searchParams.get('timeout') ? parseInt(searchParams.get('timeout')!) : SEARCH_TIMEOUT;

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Parâmetro "q" (query) é obrigatório' },
        { status: 400 }
      );
    }

    if (query.length > 100) {
      return NextResponse.json(
        { error: 'Query muito longa (máximo 100 caracteres)' },
        { status: 400 }
      );
    }

    if (minPrice !== undefined && minPrice < 0) {
      return NextResponse.json(
        { error: 'minPrice deve ser maior ou igual a 0' },
        { status: 400 }
      );
    }

    if (maxPrice !== undefined && maxPrice < 0) {
      return NextResponse.json(
        { error: 'maxPrice deve ser maior ou igual a 0' },
        { status: 400 }
      );
    }

    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      return NextResponse.json(
        { error: 'minPrice não pode ser maior que maxPrice' },
        { status: 400 }
      );
    }

    const searchConfig: SearchConfig = {
      query: query.trim(),
      maxResults,
      timeout
    };

    const filters: SearchFilters = {};
    if (stores && stores.length > 0) {
      filters.stores = stores;
    }
    if (minPrice !== undefined) {
      filters.minPrice = minPrice;
    }
    if (maxPrice !== undefined) {
      filters.maxPrice = maxPrice;
    }

    const result = await searchService.search(searchConfig, Object.keys(filters).length > 0 ? filters : undefined);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache por 5 minutos
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Erro na API de busca:', error);

    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { query, filters, config } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Campo "query" é obrigatório e deve ser uma string não vazia' },
        { status: 400 }
      );
    }

    const searchConfig: SearchConfig = {
      query: query.trim(),
      maxResults: config?.maxResults,
      timeout: config?.timeout || SEARCH_TIMEOUT
    };

    const result = await searchService.search(searchConfig, filters);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Erro na API POST de busca:', error);

    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
