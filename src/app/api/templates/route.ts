import { NextResponse } from 'next/server';
import { getAllTemplates } from '@/lib/pdf/templates';

export async function GET() {
  const templates = getAllTemplates().map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
  }));

  return NextResponse.json({ templates });
}
