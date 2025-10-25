# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-25

### Added
- **Rebranded as PDFMaid** (formerly md-mermaid-pdf)
- **New unified CLI command** `pdfmaid` - single entry point for all conversions
- Markdown to HTML conversion with Mermaid support
- HTML to PDF conversion with rendered diagrams
- Direct Markdown to PDF conversion
- Smart input detection (.md, .markdown, .html, .htm)
- Output format selection via `-o` flag (pdf/html)
- Legacy CLI commands maintained for backward compatibility: `md-to-html`, `html-to-pdf`, `md-to-pdf`
- Programmatic API for Node.js
- Dark mode theme support (`--theme dark`)
- Professional styling and formatting
- Print-optimized PDF output
- Copy buttons for code blocks
- Smooth scrolling navigation
- GitHub Flavored Markdown support
- Syntax highlighting for code blocks
- Comprehensive documentation
- `--no-interactive` flag to disable interactive features
- Short flags: `-o`, `-f`, `-t`, `-w` for better UX
- Version display with `-v` or `--version`

### Features
- ✅ Unified CLI with intelligent routing based on input type
- ✅ Full Mermaid.js diagram support (all diagram types)
- ✅ Responsive tables and styling
- ✅ A4 print layout optimization
- ✅ Cross-platform Chrome/Chromium detection
- ✅ Configurable wait times for diagram rendering
- ✅ Landscape orientation support
- ✅ Custom document titles
- ✅ Theme customization (light/dark)
- ✅ Keep intermediate HTML files with `--keep-html`
- ✅ Custom output file paths

### Changed
- Package name: `md-mermaid-pdf` → `pdfmaid`
- Main command: `md-to-pdf` → `pdfmaid` (with `-o` flag for format selection)
- Repository: https://github.com/lpetrov/pdfmaid
- Author: Lyuboslav Petrov <petrov.lyuboslav@gmail.com>

[1.0.0]: https://github.com/lpetrov/pdfmaid/releases/tag/v1.0.0
