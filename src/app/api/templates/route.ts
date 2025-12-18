import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAllTemplates, getTemplatesForPlan, getTemplateStats } from '@/lib/pdf/templates';
import { authOptions } from '@/lib/auth/config';
import { PlanType } from '@/lib/plans/config';

export async function GET(request: NextRequest) {
  // Get user session to determine plan
  const session = await getServerSession(authOptions);
  const userPlan = (session?.user?.plan as PlanType) || 'free';

  // Check if user wants all templates (including locked ones for display)
  const showAll = request.nextUrl.searchParams.get('showAll') === 'true';
  // Check if filtering by category
  const category = request.nextUrl.searchParams.get('category');

  let templates;
  if (showAll) {
    // Return all templates with premium flag for UI to show locked state
    templates = getAllTemplates();
  } else {
    // Return only templates available for user's plan
    templates = getTemplatesForPlan(userPlan);
  }

  // Filter by category if specified
  if (category) {
    templates = templates.filter((t) => t.category === category);
  }

  // Map to response format
  const responseTemplates = templates.map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    premium: template.premium || false,
    // Include content only if template is available for user's plan
    ...(showAll ? {} : { content: template.content }),
  }));

  // Get stats
  const stats = getTemplateStats();

  return NextResponse.json({
    templates: responseTemplates,
    stats,
    userPlan,
  });
}
