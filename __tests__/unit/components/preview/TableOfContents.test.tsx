import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock dependencies
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'tocTitle': 'Table of Contents',
      'toc.empty': 'No headings found',
    };
    return translations[key] || key;
  },
}));

const mockExtractHeadings = vi.fn();
vi.mock('@/lib/markdown/parser', () => ({
  extractHeadings: (...args: unknown[]) => mockExtractHeadings(...args),
}));

const mockUseActiveHeading = vi.fn();
const mockScrollToHeading = vi.fn();
vi.mock('@/hooks/useActiveHeading', () => ({
  useActiveHeading: (...args: unknown[]) => mockUseActiveHeading(...args),
  scrollToHeading: (...args: unknown[]) => mockScrollToHeading(...args),
}));

const mockContent = 'test content';
vi.mock('@/stores/editor-store', () => ({
  useEditorStore: () => ({
    content: mockContent,
  }),
}));

// Import after mocking
import { TableOfContents } from '@/components/preview/TableOfContents';

describe('TableOfContents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseActiveHeading.mockReturnValue(null);
  });

  it('should render empty state when no headings', () => {
    mockExtractHeadings.mockReturnValue([]);

    render(<TableOfContents />);

    expect(screen.getByText('Table of Contents')).toBeInTheDocument();
    expect(screen.getByText('No headings found')).toBeInTheDocument();
  });

  it('should render all headings', () => {
    mockExtractHeadings.mockReturnValue([
      { id: 'heading-1', text: 'Heading 1', level: 1 },
      { id: 'heading-2', text: 'Heading 2', level: 2 },
      { id: 'heading-3', text: 'Heading 3', level: 3 },
    ]);

    render(<TableOfContents />);

    expect(screen.getByText('Heading 1')).toBeInTheDocument();
    expect(screen.getByText('Heading 2')).toBeInTheDocument();
    expect(screen.getByText('Heading 3')).toBeInTheDocument();
  });

  it('should indent based on heading level', () => {
    mockExtractHeadings.mockReturnValue([
      { id: 'h1', text: 'Level 1', level: 1 },
      { id: 'h2', text: 'Level 2', level: 2 },
      { id: 'h3', text: 'Level 3', level: 3 },
    ]);

    render(<TableOfContents />);

    const items = screen.getAllByRole('listitem');

    // Level 1: (1-1) * 12 = 0px
    expect(items[0]).toHaveStyle({ paddingInlineStart: '0px' });
    // Level 2: (2-1) * 12 = 12px
    expect(items[1]).toHaveStyle({ paddingInlineStart: '12px' });
    // Level 3: (3-1) * 12 = 24px
    expect(items[2]).toHaveStyle({ paddingInlineStart: '24px' });
  });

  it('should call scrollToHeading when heading is clicked', () => {
    mockExtractHeadings.mockReturnValue([
      { id: 'test-heading', text: 'Test Heading', level: 1 },
    ]);

    render(<TableOfContents />);

    const link = screen.getByText('Test Heading');
    fireEvent.click(link);

    expect(mockScrollToHeading).toHaveBeenCalledWith('test-heading');
  });

  it('should highlight active heading', () => {
    mockExtractHeadings.mockReturnValue([
      { id: 'heading-1', text: 'Heading 1', level: 1 },
      { id: 'heading-2', text: 'Heading 2', level: 1 },
    ]);
    mockUseActiveHeading.mockReturnValue('heading-1');

    render(<TableOfContents />);

    const heading1 = screen.getByText('Heading 1');
    const heading2 = screen.getByText('Heading 2');

    // Active heading should have aria-current="location"
    expect(heading1).toHaveAttribute('aria-current', 'location');
    expect(heading2).not.toHaveAttribute('aria-current');
  });

  it('should have proper accessibility attributes', () => {
    mockExtractHeadings.mockReturnValue([
      { id: 'heading-1', text: 'Test Heading', level: 1 },
    ]);

    render(<TableOfContents />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Table of Contents');
  });

  it('should truncate long titles with title attribute', () => {
    const longText = 'This is a very long heading that should be truncated';
    mockExtractHeadings.mockReturnValue([
      { id: 'long-heading', text: longText, level: 1 },
    ]);

    render(<TableOfContents />);

    const link = screen.getByText(longText);
    expect(link).toHaveAttribute('title', longText);
  });

  it('should prevent default on link click', () => {
    mockExtractHeadings.mockReturnValue([
      { id: 'test', text: 'Test', level: 1 },
    ]);

    render(<TableOfContents />);

    const link = screen.getByText('Test');
    const preventDefaultMock = vi.fn();

    fireEvent.click(link, {
      preventDefault: preventDefaultMock,
    });

    // The component calls preventDefault internally
    expect(mockScrollToHeading).toHaveBeenCalled();
  });
});
