# Publishing md-mermaid-pdf

This guide explains how to publish the package to npm and GitHub.

## Prerequisites

1. **npm account**: Create one at [npmjs.com](https://www.npmjs.com/signup)
2. **GitHub account**: For hosting the repository
3. **npm CLI**: Ensure you're logged in: `npm login`

## Pre-Publication Checklist

### 1. Update package.json

Before publishing, update these fields in `package.json`:

```json
{
  "name": "md-mermaid-pdf",
  "version": "1.0.0",
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/md-mermaid-pdf.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/md-mermaid-pdf/issues"
  },
  "homepage": "https://github.com/yourusername/md-mermaid-pdf#readme"
}
```

### 2. Update LICENSE

Update the copyright holder in the `LICENSE` file:

```
Copyright (c) 2025 Your Name
```

### 3. Test the package locally

```bash
# Install dependencies
npm install

# Test all CLI commands
node bin/md-to-html.js ../../docs/roi-to-stl-technical-specification.md /tmp/test.html
node bin/html-to-pdf.js /tmp/test.html /tmp/test.pdf
node bin/md-to-pdf.js ../../docs/roi-to-stl-technical-specification.md /tmp/test-full.pdf

# Test as a global package (using npm link)
npm link
md-to-pdf ../../docs/roi-to-stl-technical-specification.md /tmp/linked-test.pdf
npm unlink -g md-mermaid-pdf
```

## Publishing to GitHub

### 1. Initialize Git repository

```bash
# From the package directory
git init
git add .
git commit -m "Initial commit: md-mermaid-pdf v1.0.0"
```

### 2. Create GitHub repository

1. Go to [github.com/new](https://github.com/new)
2. Create a new repository named `md-mermaid-pdf`
3. **Do NOT** initialize with README, license, or .gitignore (we already have these)

### 3. Push to GitHub

```bash
# Add remote
git remote add origin https://github.com/yourusername/md-mermaid-pdf.git

# Push
git branch -M main
git push -u origin main
```

### 4. Create a release

```bash
# Tag the release
git tag v1.0.0
git push origin v1.0.0
```

Or create a release through the GitHub web interface.

## Publishing to npm

### 1. Verify package contents

```bash
# See what will be published
npm pack --dry-run

# This should show:
# - bin/
# - lib/
# - README.md
# - LICENSE
# - package.json
```

### 2. Login to npm

```bash
npm login
```

### 3. Publish

```bash
# Publish the package
npm publish

# If the package name is already taken, you can publish with a scope:
npm publish --access public
```

### 4. Verify publication

```bash
# Install globally to test
npm install -g md-mermaid-pdf

# Test it works
md-to-pdf --help
```

## Publishing Updates

When publishing updates:

### 1. Update version

```bash
# Patch release (1.0.0 → 1.0.1)
npm version patch

# Minor release (1.0.0 → 1.1.0)
npm version minor

# Major release (1.0.0 → 2.0.0)
npm version major
```

This will:

- Update `package.json`
- Create a git commit
- Create a git tag

### 2. Push changes

```bash
git push && git push --tags
```

### 3. Publish to npm

```bash
npm publish
```

## Alternative: Scoped Package

If `md-mermaid-pdf` is already taken on npm, you can publish as a scoped package:

### 1. Update package.json

```json
{
  "name": "@yourusername/md-mermaid-pdf",
  ...
}
```

### 2. Publish

```bash
npm publish --access public
```

### 3. Install

```bash
npm install -g @yourusername/md-mermaid-pdf
```

## Package Naming Alternatives

If the name is taken, consider these alternatives:

- `markdown-mermaid-pdf`
- `md2pdf-mermaid`
- `mermaid-markdown-pdf`
- `doc-to-pdf-mermaid`
- `@yourusername/md-mermaid-pdf` (scoped)

## Maintenance

### Setting up CI/CD (Optional)

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Add badges to README

After publishing, update README.md with actual badges:

```markdown
[![npm version](https://img.shields.io/npm/v/md-mermaid-pdf.svg)](https://www.npmjs.com/package/md-mermaid-pdf)
[![downloads](https://img.shields.io/npm/dm/md-mermaid-pdf.svg)](https://www.npmjs.com/package/md-mermaid-pdf)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

## Troubleshooting

### "Package name already exists"

- Choose a different name or use a scoped package (`@username/package-name`)
- Check availability: `npm search md-mermaid-pdf`

### "You do not have permission to publish"

- Make sure you're logged in: `npm whoami`
- For scoped packages, use: `npm publish --access public`

### "Invalid package.json"

- Validate with: `npm pack --dry-run`
- Check required fields: name, version, main

## Support

For issues or questions:

- GitHub Issues: https://github.com/yourusername/md-mermaid-pdf/issues
- npm: https://www.npmjs.com/package/md-mermaid-pdf
