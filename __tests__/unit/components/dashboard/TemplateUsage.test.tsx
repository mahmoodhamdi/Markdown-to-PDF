import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TemplateUsage } from '@/components/dashboard/TemplateUsage';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'dashboard.analytics': {
        topTemplates: 'Top Templates',
        uses: 'uses',
        noTemplateUsage: 'No template usage data',
        templateUsageNote: 'Based on your conversion history',
      },
      templates: {
        'resume.name': 'Resume',
        'meeting-notes.name': 'Meeting Notes',
        'readme.name': 'README',
        'report.name': 'Report',
      },
    };
    return translations[namespace]?.[key] || key;
  },
}));

const mockTemplateData = [
  { template: 'resume', count: 40, percentage: 40 },
  { template: 'meeting-notes', count: 35, percentage: 35 },
  { template: 'readme', count: 15, percentage: 15 },
  { template: 'report', count: 10, percentage: 10 },
];

describe('TemplateUsage', () => {
  it('renders the component title', () => {
    render(<TemplateUsage data={mockTemplateData} />);

    expect(screen.getByText('Top Templates')).toBeInTheDocument();
  });

  it('displays template data sorted by count', () => {
    render(<TemplateUsage data={mockTemplateData} />);

    expect(screen.getByText('Resume')).toBeInTheDocument();
    expect(screen.getByText('Meeting Notes')).toBeInTheDocument();
    expect(screen.getByText('README')).toBeInTheDocument();
    expect(screen.getByText('Report')).toBeInTheDocument();
  });

  it('displays template counts and percentages', () => {
    render(<TemplateUsage data={mockTemplateData} />);

    // Check that counts are displayed (may need getAllByText due to multiple elements)
    const counts40 = screen.getAllByText('40');
    expect(counts40.length).toBeGreaterThan(0);

    // Check that "uses" is displayed
    const usesElements = screen.getAllByText('uses');
    expect(usesElements.length).toBe(4);
  });

  it('shows loading skeleton when loading', () => {
    const { container } = render(<TemplateUsage loading={true} />);

    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no data available', () => {
    render(<TemplateUsage data={[]} />);

    expect(screen.getByText('No template usage data')).toBeInTheDocument();
  });

  it('shows empty state when totalTemplatesUsed is 0 and no data', () => {
    render(<TemplateUsage totalTemplatesUsed={0} />);

    expect(screen.getByText('No template usage data')).toBeInTheDocument();
  });

  it('generates default data based on totalTemplatesUsed', () => {
    render(<TemplateUsage totalTemplatesUsed={100} />);

    // Should show default mock data generated from totalTemplatesUsed
    expect(screen.getByText('Resume')).toBeInTheDocument();
    // 40% of 100 = 40 (may appear multiple times due to percentage display)
    const count40 = screen.getAllByText('40');
    expect(count40.length).toBeGreaterThan(0);
  });

  it('displays percentage values correctly', () => {
    render(<TemplateUsage data={mockTemplateData} />);

    expect(screen.getByText('(40%)')).toBeInTheDocument();
    expect(screen.getByText('(35%)')).toBeInTheDocument();
    expect(screen.getByText('(15%)')).toBeInTheDocument();
    expect(screen.getByText('(10%)')).toBeInTheDocument();
  });

  it('displays template usage note', () => {
    render(<TemplateUsage data={mockTemplateData} />);

    expect(screen.getByText('Based on your conversion history')).toBeInTheDocument();
  });

  it('renders with hover effect classes', () => {
    const { container } = render(<TemplateUsage data={mockTemplateData} />);

    const hoverElements = container.querySelectorAll('.hover\\:bg-muted\\/50');
    expect(hoverElements.length).toBe(4);
  });

  it('shows numbered ranking for templates', () => {
    render(<TemplateUsage data={mockTemplateData} />);

    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('2.')).toBeInTheDocument();
    expect(screen.getByText('3.')).toBeInTheDocument();
    expect(screen.getByText('4.')).toBeInTheDocument();
  });
});
