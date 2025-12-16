# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-12-16

### Added
- **Loading Skeletons** (QUAL-006): Pre-built skeleton components for better loading UX
- **Error Boundary** (QUAL-005): Graceful error handling with recovery options
- **JSDoc Documentation** (QUAL-004): Comprehensive documentation for public functions
- **Prettier Integration** (QUAL-002): Consistent code formatting across the project
- **Accessibility Tests** (TEST-007): WCAG 2.0 AA compliance testing with axe-core
- **E2E Conversion Tests** (TEST-006): Complete Playwright test coverage for conversion flows
- **API Integration Tests** (TEST-003): Tests for all API endpoints (health, themes, templates, preview)
- **Unit Tests for Page Settings** (TEST-002): Comprehensive tests for page configuration utilities

### Changed
- **ESLint Configuration** (QUAL-001): Stricter rules for unused variables and code quality
- **Type Imports** (QUAL-003): Consolidated type imports in generator.ts for cleaner code

### Performance
- **Browser Pool** (PERF-001): Puppeteer browser instance reuse for faster PDF generation
- **Debounced Preview** (PERF-002): Reduced re-renders during typing with 300ms debounce
- **Batch Optimization** (PERF-003): Parallel PDF generation with shared resources
- **Service Worker** (PERF-004): Offline support and asset caching

## [1.0.0] - 2024-12-15

### Added
- **Undo/Redo Support**: Full undo/redo functionality in the editor
- **Fullscreen Mode**: Distraction-free editing experience
- **Print Functionality**: Direct printing from the application
- **Toast Notifications**: User feedback with sonner notification system
- **Keyboard Shortcuts**: Formatting shortcuts (Ctrl+B, Ctrl+I, etc.) and navigation
- **Table of Contents**: Auto-generated TOC with toggle display
- **Auto-Save**: Automatic content saving with visual feedback
- **Settings Page**: Editor preferences and default configurations
- **Rate Limiting**: API protection against abuse
- **Security Improvements**: XSS prevention, input sanitization, CSP headers

### Fixed
- Toolbar buttons now correctly insert text at cursor position
- Build errors for CI/CD pipeline resolved

## [0.1.0] - 2024-12-14

### Added
- Initial release of Markdown to PDF converter
- **Markdown Editor**: Monaco-based editor with syntax highlighting
- **Live Preview**: Real-time markdown rendering
- **PDF Generation**: Puppeteer-based PDF conversion
- **Multiple Themes**: GitHub, Academic, Minimal, Dark, Professional
- **Code Highlighting**: 7 code syntax themes with highlight.js
- **Math Support**: KaTeX integration for LaTeX equations
- **Diagram Support**: Mermaid diagram rendering
- **Emoji Support**: Shortcode to Unicode conversion
- **Internationalization**: English and Arabic (RTL) support
- **Batch Conversion**: Multiple file processing
- **Page Settings**: Size, orientation, margins, watermarks
- **Responsive Design**: Mobile, tablet, and desktop layouts

### Technical
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Zustand for state management
- Radix UI primitives
- Vitest for testing
- Playwright for E2E tests

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.1.0 | 2024-12-16 | Code quality, testing, and performance improvements |
| 1.0.0 | 2024-12-15 | Feature complete release with editor enhancements |
| 0.1.0 | 2024-12-14 | Initial release |
