import { NextResponse } from 'next/server';
import { getAllThemes, codeThemes } from '@/lib/themes/manager';

export async function GET() {
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

  return NextResponse.json({
    documentThemes,
    codeThemes: codeThemeList,
  });
}
