import { NextRequest, NextResponse } from 'next/server';
import { generatePdf } from '@/lib/pdf/generator';
import { ConversionOptions } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: ConversionOptions = await request.json();

    if (!body.markdown || body.markdown.trim() === '') {
      return NextResponse.json(
        { error: 'Content is empty' },
        { status: 400 }
      );
    }

    const result = await generatePdf(body);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Conversion failed' },
        { status: 500 }
      );
    }

    // Convert to Uint8Array for Response compatibility
    const pdfData = Buffer.isBuffer(result.data)
      ? Uint8Array.from(result.data)
      : typeof result.data === 'string'
        ? new TextEncoder().encode(result.data)
        : result.data;

    return new Response(pdfData as BlobPart, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="document.pdf"',
        'Content-Length': result.fileSize?.toString() || '0',
      },
    });
  } catch (error) {
    console.error('Convert API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/convert',
    method: 'POST',
    description: 'Convert Markdown to PDF',
    parameters: {
      markdown: { type: 'string', required: true },
      theme: { type: 'string', required: false, default: 'github' },
      codeTheme: { type: 'string', required: false, default: 'github-light' },
      pageSettings: { type: 'object', required: false },
      customCss: { type: 'string', required: false },
    },
  });
}
