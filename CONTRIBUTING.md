# Contributing to Markdown-to-PDF

Thank you for your interest in contributing to Markdown-to-PDF! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- Git

### Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Markdown-to-PDF.git
   cd Markdown-to-PDF
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── [locale]/          # Internationalized routes
│   └── api/               # API routes
├── components/            # React components
│   ├── editor/           # Editor-related components
│   ├── preview/          # Preview components
│   ├── converter/        # Conversion components
│   ├── layout/           # Layout components
│   └── ui/               # UI primitives
├── lib/                   # Core libraries
│   ├── markdown/         # Markdown parsing
│   ├── pdf/              # PDF generation
│   └── themes/           # Theme management
├── stores/               # Zustand state stores
├── types/                # TypeScript types
├── i18n/                 # Internationalization
└── messages/             # Translation files
```

## Development Workflow

### Branch Naming

Use descriptive branch names:
- `feat/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Test additions/changes

### Commit Messages

Follow conventional commits:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code restructuring
- `test` - Tests
- `chore` - Maintenance

### Development Commands

```bash
# Start development server
npm run dev

# Run linting
npm run lint

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run all tests with coverage
npm run test:coverage

# Format code
npm run format

# Check formatting
npm run format:check

# Build for production
npm run build
```

## Pull Request Process

1. **Create a branch** from `main` for your changes
2. **Make your changes** following the coding standards
3. **Write/update tests** for your changes
4. **Run all tests** to ensure nothing is broken
5. **Update documentation** if needed
6. **Create a pull request** with a clear description

### PR Checklist

- [ ] Tests pass (`npm run test:unit && npm run test:integration`)
- [ ] Lint passes (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] Documentation updated if needed
- [ ] Commit messages follow convention
- [ ] PR description explains the changes

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define types/interfaces for props and state
- Avoid `any` type where possible
- Use functional components with hooks

### React Components

```typescript
// Good
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline';
  onClick?: () => void;
}

export function Button({ children, variant = 'default', onClick }: ButtonProps) {
  return (
    <button className={cn('btn', `btn-${variant}`)} onClick={onClick}>
      {children}
    </button>
  );
}

// Avoid
export function Button(props: any) {
  // ...
}
```

### File Organization

- One component per file
- Use named exports
- Group related files in directories
- Keep files under 300 lines when possible

### Styling

- Use Tailwind CSS for styling
- Use `cn()` utility for conditional classes
- Follow existing design patterns
- Support both LTR and RTL layouts

## Testing

### Unit Tests

Located in `__tests__/unit/`. Test pure functions and isolated components.

```typescript
import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '@/lib/markdown/parser';

describe('parseMarkdown', () => {
  it('should convert markdown to HTML', () => {
    const result = parseMarkdown('# Hello');
    expect(result.html).toContain('<h1');
  });
});
```

### Integration Tests

Located in `__tests__/integration/`. Test API routes and component interactions.

### E2E Tests

Located in `__tests__/e2e/`. Test complete user flows with Playwright.

### Test Coverage

- Aim for 80%+ coverage on new code
- Cover edge cases and error scenarios
- Don't just test the happy path

## Documentation

### Code Documentation

- Add JSDoc comments to public functions
- Document complex logic with inline comments
- Keep README and docs up to date

### Translation

When adding UI text:
1. Add strings to `src/messages/en.json`
2. Add Arabic translations to `src/messages/ar.json`
3. Use `useTranslations()` hook in components

```typescript
const t = useTranslations('common');
return <button>{t('save')}</button>;
```

## Questions?

Feel free to open an issue for:
- Bug reports
- Feature requests
- Questions about the codebase

Thank you for contributing!
