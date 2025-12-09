import { NextRequest, NextResponse } from 'next/server';
import { generateHtmlPreview } from '@/lib/pdf/generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.markdown || body.markdown.trim() === '') {
      return NextResponse.json(
        { error: 'Content is empty' },
        { status: 400 }
      );
    }

    const html = await generateHtmlPreview(body.markdown, body.theme);

    return NextResponse.json({ html });
  } catch (error) {
    console.error('Preview API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
