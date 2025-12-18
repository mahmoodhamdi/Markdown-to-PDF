'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import Head from 'next/head';

export default function SwaggerPage() {
  const t = useTranslations('apiDocs');
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Save and temporarily remove AMD define to avoid conflicts
    const windowWithAMD = window as unknown as {
      define?: unknown;
      SwaggerUIBundle?: (config: Record<string, unknown>) => void;
      SwaggerUIStandalonePreset?: unknown;
    };
    const savedDefine = windowWithAMD.define;

    // Temporarily disable AMD to prevent conflicts with Monaco
    if (savedDefine) {
      delete windowWithAMD.define;
    }

    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css';
    document.head.appendChild(link);

    // Load scripts sequentially
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const initSwagger = async () => {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js');
        await loadScript('https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js');

        if (windowWithAMD.SwaggerUIBundle && windowWithAMD.SwaggerUIStandalonePreset) {
          windowWithAMD.SwaggerUIBundle({
            url: '/openapi.json',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              (windowWithAMD.SwaggerUIBundle as unknown as { presets: { apis: unknown } }).presets.apis,
              windowWithAMD.SwaggerUIStandalonePreset,
            ],
            plugins: [
              (windowWithAMD.SwaggerUIBundle as unknown as { plugins: { DownloadUrl: unknown } }).plugins.DownloadUrl,
            ],
            layout: 'StandaloneLayout',
            defaultModelsExpandDepth: 1,
            defaultModelExpandDepth: 1,
            docExpansion: 'list',
            filter: true,
            showExtensions: true,
            showCommonExtensions: true,
            syntaxHighlight: {
              activate: true,
              theme: 'monokai',
            },
          });
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load Swagger UI:', error);
        setIsLoading(false);
      } finally {
        // Restore AMD define after Swagger is loaded
        if (savedDefine) {
          windowWithAMD.define = savedDefine;
        }
      }
    };

    initSwagger();

    return () => {
      // Cleanup
      if (savedDefine && !windowWithAMD.define) {
        windowWithAMD.define = savedDefine;
      }
    };
  }, []);

  return (
    <>
      <Head>
        <style>{`
          .swagger-ui .topbar { display: none; }
          .swagger-ui .info { margin: 20px 0; }
          .swagger-ui .scheme-container { padding: 15px 0; }
          .dark .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
          .dark .swagger-ui .model-box { background-color: #1a1a1a; }
          .dark .swagger-ui img { filter: invert(100%) hue-rotate(180deg); }
        `}</style>
      </Head>
      <style jsx global>{`
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .scheme-container { padding: 15px 0; }
        .dark .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
        .dark .swagger-ui .model-box { background-color: #1a1a1a; }
        .dark .swagger-ui img { filter: invert(100%) hue-rotate(180deg); }
      `}</style>
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{t('title')} - Swagger UI</h1>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>
        {isLoading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-muted-foreground">Loading Swagger UI...</div>
          </div>
        )}
        <div
          id="swagger-ui"
          ref={containerRef}
          className="bg-white rounded-lg shadow-sm min-h-[600px]"
          style={{ display: isLoading ? 'none' : 'block' }}
        />
      </div>
    </>
  );
}
