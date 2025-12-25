# Stage 2.4: Print Functionality

**Phase:** 2 - UI/UX Completion
**Priority:** 🟠 High
**Estimated Effort:** Small

---

## Context

No print functionality exists. Users cannot print their documents directly from the browser without downloading as PDF first.

### Current State

- ConvertButton only handles PDF/HTML download
- No print option in UI
- No print-specific CSS

---

## Task Requirements

### 1. Add Print Button

**File to modify:** `src/components/converter/ConvertButton.tsx`

Add print option to the dropdown:

```tsx
<DropdownMenuItem onClick={handlePrint}>
  <Printer className="mr-2 h-4 w-4" />
  {t('print')}
</DropdownMenuItem>
```

### 2. Implement Print Function

```typescript
function handlePrint() {
  // Create a hidden iframe for printing
  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'absolute';
  printFrame.style.top = '-9999px';
  printFrame.style.left = '-9999px';
  document.body.appendChild(printFrame);

  const printDocument = printFrame.contentDocument;
  if (!printDocument) return;

  // Get the preview content with styles
  const previewContent = document.querySelector('.markdown-preview');
  const themeStyles = getThemeStyles(documentTheme);

  printDocument.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${t('printTitle')}</title>
        <style>
          ${getPrintStyles()}
          ${themeStyles}
        </style>
      </head>
      <body>
        ${previewContent?.innerHTML || ''}
      </body>
    </html>
  `);
  printDocument.close();

  // Wait for content to load, then print
  printFrame.onload = () => {
    printFrame.contentWindow?.print();
    document.body.removeChild(printFrame);
  };
}
```

### 3. Add Print-Specific CSS

**File to modify:** `src/app/globals.css`

```css
@media print {
  /* Hide non-printable elements */
  header,
  footer,
  nav,
  .no-print,
  .editor-toolbar,
  .sidebar {
    display: none !important;
  }

  /* Reset page margins */
  @page {
    margin: 1in;
  }

  /* Ensure proper page breaks */
  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
  }

  p, li, blockquote {
    orphans: 3;
    widows: 3;
  }

  pre, code, table {
    page-break-inside: avoid;
  }

  /* Ensure links are readable */
  a[href]::after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
    color: #666;
  }

  /* Reset colors for print */
  body {
    color: black !important;
    background: white !important;
  }

  /* Code blocks */
  pre {
    background: #f5f5f5 !important;
    border: 1px solid #ddd;
  }
}
```

### 4. Create Print Styles Utility

**File to create:** `src/lib/print/styles.ts`

```typescript
export function getPrintStyles(): string {
  return `
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12pt;
      line-height: 1.5;
      color: black;
      background: white;
      max-width: 100%;
      padding: 0;
      margin: 0;
    }

    h1 { font-size: 24pt; margin-top: 24pt; }
    h2 { font-size: 20pt; margin-top: 20pt; }
    h3 { font-size: 16pt; margin-top: 16pt; }
    h4 { font-size: 14pt; margin-top: 14pt; }

    pre, code {
      font-family: 'Courier New', monospace;
      font-size: 10pt;
      background: #f5f5f5;
      padding: 2pt 4pt;
    }

    pre {
      padding: 12pt;
      border: 1pt solid #ddd;
      overflow-x: auto;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      margin: 12pt 0;
    }

    th, td {
      border: 1pt solid #ddd;
      padding: 6pt 12pt;
      text-align: left;
    }

    th {
      background: #f5f5f5;
    }

    img {
      max-width: 100%;
      height: auto;
    }

    blockquote {
      border-left: 3pt solid #ddd;
      margin-left: 0;
      padding-left: 12pt;
      color: #666;
    }
  `;
}
```

### 5. Add Keyboard Shortcut

```typescript
// Ctrl+P to print
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      handlePrint();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [handlePrint]);
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/converter/ConvertButton.tsx` | Modify |
| `src/app/globals.css` | Add print styles |
| `src/lib/print/styles.ts` | Create |

---

## Visual Design

### Print Dialog Flow

1. User clicks Print button or presses Ctrl+P
2. Browser's native print dialog opens
3. Preview shows the formatted document
4. User can adjust settings and print

### Print Preview

The printed document should:
- Use the selected document theme
- Have clean margins
- Show syntax highlighting (colors)
- Display tables with borders
- Include images at appropriate size

---

## Testing Requirements

### Unit Tests

**File to create:** `__tests__/unit/lib/print/styles.test.ts`

Test cases:
- [ ] getPrintStyles returns valid CSS
- [ ] Print styles include page break rules
- [ ] Print styles handle code blocks

### E2E Tests

**File to add tests:** `__tests__/e2e/print.spec.ts`

Test cases:
- [ ] Print button is visible
- [ ] Ctrl+P opens print dialog
- [ ] Print preview shows content

---

## Translations

Add to `src/messages/en.json`:
```json
{
  "converter": {
    "print": "Print",
    "printTitle": "Markdown Document",
    "printHint": "Ctrl+P"
  }
}
```

Add equivalent to `src/messages/ar.json`

---

## Definition of Done

- [ ] Print button in ConvertButton dropdown
- [ ] Print function works correctly
- [ ] Print CSS styles applied
- [ ] Theme styles included in print
- [ ] Ctrl+P keyboard shortcut works
- [ ] Page breaks handled properly
- [ ] Images print correctly
- [ ] Tables print with borders
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Translations added (EN & AR)
- [ ] No TypeScript errors
- [ ] ESLint passes

---

## Implementation Notes

1. **Cross-Browser:** Test on Chrome, Firefox, Safari, Edge
2. **Background Colors:** Some browsers don't print backgrounds by default
3. **Links:** Consider showing URLs in print
4. **Math/Diagrams:** Ensure KaTeX and Mermaid render correctly
5. **Large Documents:** Test with long documents for page breaks

---

*When complete, update `MASTER_IMPLEMENTATION_PLAN.md` Stage 2.4 status to ✅ Complete*
