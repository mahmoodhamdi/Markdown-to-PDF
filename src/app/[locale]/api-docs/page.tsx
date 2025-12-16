'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ApiDocsPage() {
  const t = useTranslations('apiDocs');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const endpoints = [
    {
      id: 'convert',
      method: 'POST',
      path: '/api/convert',
      title: t('convertEndpoint.title'),
      description: t('convertEndpoint.desc'),
      requestBody: `{
  "markdown": "# Hello World\\n\\nThis is **bold** text.",
  "theme": "github",
  "codeTheme": "github-light",
  "pageSettings": {
    "pageSize": "a4",
    "orientation": "portrait",
    "margins": {
      "top": 20,
      "bottom": 20,
      "left": 20,
      "right": 20
    }
  }
}`,
      response: 'Binary PDF file',
      curlExample: `curl -X POST https://your-domain.com/api/convert \\
  -H "Content-Type: application/json" \\
  -d '{"markdown": "# Hello World"}' \\
  -o document.pdf`,
    },
    {
      id: 'preview',
      method: 'POST',
      path: '/api/preview',
      title: t('previewEndpoint.title'),
      description: t('previewEndpoint.desc'),
      requestBody: `{
  "markdown": "# Hello World\\n\\nThis is **bold** text.",
  "theme": "github"
}`,
      response: `{
  "html": "<h1>Hello World</h1>\\n<p>This is <strong>bold</strong> text.</p>"
}`,
      curlExample: `curl -X POST https://your-domain.com/api/preview \\
  -H "Content-Type: application/json" \\
  -d '{"markdown": "# Hello World"}'`,
    },
  ];

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
      </div>

      {/* Introduction */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t('introduction')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{t('introText')}</p>

          <div>
            <h4 className="font-medium mb-2">{t('baseUrl')}</h4>
            <code className="block p-3 bg-muted rounded-lg">
              https://your-domain.com/api
            </code>
          </div>

          <div>
            <h4 className="font-medium mb-2">{t('authentication')}</h4>
            <p className="text-sm text-muted-foreground">{t('authText')}</p>
          </div>

          <div>
            <h4 className="font-medium mb-2">{t('rateLimit')}</h4>
            <p className="text-sm text-muted-foreground">{t('rateLimitText', { limit: 60 })}</p>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <h2 className="text-2xl font-bold mb-6">{t('endpoints')}</h2>

      {endpoints.map((endpoint) => (
        <Card key={endpoint.id} className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span
                className={cn(
                  'px-2 py-1 text-xs font-mono rounded',
                  endpoint.method === 'GET' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                )}
              >
                {endpoint.method}
              </span>
              <code>{endpoint.path}</code>
            </CardTitle>
            <CardDescription>{endpoint.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="request">
              <TabsList>
                <TabsTrigger value="request">{t('request')}</TabsTrigger>
                <TabsTrigger value="response">{t('response')}</TabsTrigger>
                <TabsTrigger value="curl">cURL</TabsTrigger>
              </TabsList>

              <TabsContent value="request" className="mt-4">
                <div className="relative">
                  <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                    <code>{endpoint.requestBody}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 end-2"
                    onClick={() => copyCode(endpoint.requestBody, `${endpoint.id}-request`)}
                  >
                    {copiedCode === `${endpoint.id}-request` ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="response" className="mt-4">
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                  <code>{endpoint.response}</code>
                </pre>
              </TabsContent>

              <TabsContent value="curl" className="mt-4">
                <div className="relative">
                  <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                    <code>{endpoint.curlExample}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 end-2"
                    onClick={() => copyCode(endpoint.curlExample, `${endpoint.id}-curl`)}
                  >
                    {copiedCode === `${endpoint.id}-curl` ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ))}

      {/* Error Codes */}
      <Card>
        <CardHeader>
          <CardTitle>{t('errors.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
              <code className="text-sm font-mono">400</code>
              <span className="text-sm">{t('errors.400')}</span>
            </div>
            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
              <code className="text-sm font-mono">429</code>
              <span className="text-sm">{t('errors.429')}</span>
            </div>
            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
              <code className="text-sm font-mono">500</code>
              <span className="text-sm">{t('errors.500')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
