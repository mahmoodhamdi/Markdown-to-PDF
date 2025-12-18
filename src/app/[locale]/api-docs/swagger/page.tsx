'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Script from 'next/script';

export default function SwaggerPage() {
  const t = useTranslations('apiDocs');
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Initialize Swagger UI when the script loads
    const initSwagger = () => {
      if (initializedRef.current) return;
      if (typeof window !== 'undefined' && (window as unknown as { SwaggerUIBundle?: unknown }).SwaggerUIBundle) {
        initializedRef.current = true;
        const SwaggerUIBundle = (window as unknown as { SwaggerUIBundle: (config: Record<string, unknown>) => void }).SwaggerUIBundle;
        SwaggerUIBundle({
          url: '/openapi.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            (window as unknown as { SwaggerUIBundle: { presets: { apis: unknown } } }).SwaggerUIBundle.presets.apis,
            (window as unknown as { SwaggerUIStandalonePreset: unknown }).SwaggerUIStandalonePreset,
          ],
          plugins: [
            (window as unknown as { SwaggerUIBundle: { plugins: { DownloadUrl: unknown } } }).SwaggerUIBundle.plugins.DownloadUrl,
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
    };

    // Check if SwaggerUIBundle is already loaded
    if ((window as unknown as { SwaggerUIBundle?: unknown }).SwaggerUIBundle) {
      initSwagger();
    }

    // Listen for script load
    window.addEventListener('swagger-loaded', initSwagger);
    return () => window.removeEventListener('swagger-loaded', initSwagger);
  }, []);

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"
        strategy="afterInteractive"
        onLoad={() => {
          window.dispatchEvent(new Event('swagger-loaded'));
        }}
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"
        strategy="afterInteractive"
      />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css"
      />
      <style>{`
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
        <div
          id="swagger-ui"
          ref={containerRef}
          className="bg-white rounded-lg shadow-sm min-h-[600px]"
        />
      </div>
    </>
  );
}
