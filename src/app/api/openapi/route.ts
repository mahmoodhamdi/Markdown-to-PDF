import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

let cachedSpec: object | null = null;

export async function GET() {
  try {
    // Cache the spec in memory
    if (!cachedSpec) {
      const specPath = join(process.cwd(), 'public', 'openapi.json');
      const specContent = readFileSync(specPath, 'utf-8');
      cachedSpec = JSON.parse(specContent);
    }

    return NextResponse.json(cachedSpec, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Failed to load OpenAPI spec:', error);
    return NextResponse.json(
      { error: 'Failed to load API specification' },
      { status: 500 }
    );
  }
}
