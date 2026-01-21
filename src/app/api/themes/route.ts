import { NextRequest, NextResponse } from 'next/server';
import { getAllThemes, codeThemes } from '@/lib/themes/manager';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  // Get IP for rate limiting (public endpoint)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // Rate limit: 120 requests per minute per IP
  const rateLimitResult = checkRateLimit(`themes:${ip}`, 120, 60000);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  const documentThemes = getAllThemes().map((theme) => ({
    id: theme.id,
    name: theme.name,
    description: theme.description,
  }));

  const codeThemeList = Object.keys(codeThemes).map((id) => ({
    id,
    name: id
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
  }));

  return NextResponse.json(
    {
      documentThemes,
      codeThemes: codeThemeList,
    },
    { headers: getRateLimitHeaders(rateLimitResult) }
  );
}
