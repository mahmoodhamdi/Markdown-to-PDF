import { NextRequest, NextResponse } from 'next/server';
import { generatePdf } from '@/lib/pdf/generator';

interface BatchItem {
  id: string;
  filename: string;
  markdown: string;
}

interface BatchRequest {
  files: BatchItem[];
  theme?: string;
  codeTheme?: string;
  pageSettings?: object;
}

export async function POST(request: NextRequest) {
  try {
    const body: BatchRequest = await request.json();

    if (!body.files || !Array.isArray(body.files) || body.files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    if (body.files.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 files allowed' },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      body.files.map(async (file) => {
        try {
          const result = await generatePdf({
            markdown: file.markdown,
            theme: body.theme as import('@/types').DocumentTheme,
            codeTheme: body.codeTheme as import('@/types').CodeTheme,
            pageSettings: body.pageSettings as import('@/types').PageSettings,
          });

          if (result.success && result.data) {
            return {
              id: file.id,
              filename: file.filename.replace(/\.(md|markdown|txt)$/i, '.pdf'),
              success: true,
              data: Buffer.from(result.data).toString('base64'),
              fileSize: result.fileSize,
            };
          }

          return {
            id: file.id,
            filename: file.filename,
            success: false,
            error: result.error || 'Conversion failed',
          };
        } catch (error) {
          return {
            id: file.id,
            filename: file.filename,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: failedCount === 0,
      results,
      summary: {
        total: body.files.length,
        success: successCount,
        failed: failedCount,
      },
    });
  } catch (error) {
    console.error('Batch convert API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
