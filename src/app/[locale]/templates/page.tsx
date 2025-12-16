'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAllTemplates } from '@/lib/pdf/templates';
import { useEditorStore } from '@/stores/editor-store';
import { Template } from '@/types';
import { FileText, Eye } from 'lucide-react';

export default function TemplatesPage() {
  const t = useTranslations('templates');
  const router = useRouter();
  const { setContent } = useEditorStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const templates = getAllTemplates();
  const categories = ['all', 'business', 'academic', 'personal', 'technical'] as const;

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter((template) => template.category === selectedCategory);

  const handleUseTemplate = (template: Template) => {
    setContent(template.content);
    router.push('/');
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
        <TabsList>
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {t(`categories.${category}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t(`items.${template.id}`)}
              </CardTitle>
              <CardDescription>
                {t(`items.${template.id}Desc`)}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-end">
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleUseTemplate(template)}
                >
                  <Eye className="h-4 w-4 me-2" />
                  {t('previewTemplate')}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleUseTemplate(template)}
                >
                  {t('useTemplate')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
