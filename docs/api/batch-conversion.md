# Batch Conversion API

The batch conversion endpoint allows you to convert multiple Markdown files to PDF in a single request.

## Endpoint

```
POST /api/convert/batch
```

## Request

### Headers

| Header | Value | Required |
|--------|-------|----------|
| Content-Type | application/json | Yes |

### Body

```json
{
  "files": [
    {
      "id": "string",
      "filename": "string",
      "markdown": "string"
    }
  ],
  "theme": "string",
  "codeTheme": "string",
  "pageSettings": {
    "pageSize": "a4" | "letter" | "legal" | "a3" | "custom",
    "orientation": "portrait" | "landscape",
    "margins": {
      "top": number,
      "bottom": number,
      "left": number,
      "right": number
    },
    "headerFooter": {
      "showHeader": boolean,
      "showFooter": boolean,
      "headerText": "string",
      "footerText": "string"
    },
    "pageNumbers": {
      "show": boolean,
      "position": "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"
    },
    "watermark": {
      "show": boolean,
      "text": "string",
      "opacity": number
    }
  }
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| files | array | Yes | Array of files to convert |
| files[].id | string | Yes | Unique identifier for the file |
| files[].filename | string | Yes | Original filename (used for output naming) |
| files[].markdown | string | Yes | Markdown content to convert |
| theme | string | No | Document theme (default: "github") |
| codeTheme | string | No | Code syntax theme (default: "github-light") |
| pageSettings | object | No | Page layout configuration |

### Available Themes

**Document Themes:**
- `github` - GitHub-style formatting (default)
- `academic` - Academic paper formatting
- `minimal` - Clean, minimal design
- `dark` - Dark mode theme
- `professional` - Business document style

**Code Themes:**
- `github-light` (default)
- `github-dark`
- `monokai`
- `dracula`
- `nord`
- `atom-one-dark`
- `vs2015`

## Response

### Success Response

```json
{
  "success": true,
  "results": [
    {
      "id": "string",
      "filename": "output.pdf",
      "success": true,
      "data": "base64-encoded-pdf",
      "fileSize": number
    }
  ],
  "totalFiles": number,
  "successCount": number,
  "failureCount": number
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message"
}
```

### Individual File Errors

When some files fail but others succeed:

```json
{
  "success": true,
  "results": [
    {
      "id": "file1",
      "filename": "document1.pdf",
      "success": true,
      "data": "base64...",
      "fileSize": 12345
    },
    {
      "id": "file2",
      "filename": "document2.md",
      "success": false,
      "error": "Content is empty"
    }
  ],
  "totalFiles": 2,
  "successCount": 1,
  "failureCount": 1
}
```

## Example Usage

### cURL

```bash
curl -X POST https://your-domain.com/api/convert/batch \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      {
        "id": "1",
        "filename": "readme.md",
        "markdown": "# Hello World\n\nThis is a test document."
      },
      {
        "id": "2",
        "filename": "notes.md",
        "markdown": "# Notes\n\n- Item 1\n- Item 2"
      }
    ],
    "theme": "github",
    "pageSettings": {
      "pageSize": "a4",
      "orientation": "portrait"
    }
  }'
```

### JavaScript/TypeScript

```typescript
async function convertBatch(files: Array<{id: string, filename: string, markdown: string}>) {
  const response = await fetch('/api/convert/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files,
      theme: 'github',
      pageSettings: {
        pageSize: 'a4',
        orientation: 'portrait',
      },
    }),
  });

  const result = await response.json();

  if (result.success) {
    // Process successful conversions
    result.results.forEach((file) => {
      if (file.success) {
        // Decode base64 and download
        const blob = base64ToBlob(file.data, 'application/pdf');
        downloadBlob(blob, file.filename);
      }
    });
  }

  return result;
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
```

### Python

```python
import requests
import base64

def convert_batch(files):
    response = requests.post(
        'https://your-domain.com/api/convert/batch',
        json={
            'files': files,
            'theme': 'github',
            'pageSettings': {
                'pageSize': 'a4',
                'orientation': 'portrait'
            }
        }
    )

    result = response.json()

    if result['success']:
        for file in result['results']:
            if file['success']:
                pdf_data = base64.b64decode(file['data'])
                with open(file['filename'], 'wb') as f:
                    f.write(pdf_data)

    return result

# Usage
files = [
    {'id': '1', 'filename': 'doc1.md', 'markdown': '# Document 1'},
    {'id': '2', 'filename': 'doc2.md', 'markdown': '# Document 2'},
]
convert_batch(files)
```

## Rate Limiting

- Default: 10 requests per minute per IP
- Maximum files per request: 20
- Maximum file size: 1MB per file

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success (check individual file results) |
| 400 | Bad request - Invalid input |
| 429 | Too many requests - Rate limit exceeded |
| 500 | Server error |

## Notes

- Files are processed in parallel for optimal performance
- The response uses base64 encoding for PDF data to ensure safe JSON transmission
- Empty markdown content will result in a failure for that specific file
- Filenames are automatically converted to `.pdf` extension in the response
