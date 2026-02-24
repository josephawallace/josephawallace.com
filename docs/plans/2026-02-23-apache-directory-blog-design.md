# Apache Directory Blog Design

## Overview

Personal blog styled as an Apache `mod_autoindex` directory listing. Built with Next.js 16, MDX content files, and a catch-all route that renders either directory listings or post reading views.

## Content Model

MDX files live in `content/` mirroring URL paths:

```
content/
  archives/
    old-post.mdx
  contact/
    index.mdx
  my-blog-post.mdx
  deployment-strategies.mdx
```

Each MDX file has frontmatter:

```yaml
---
title: Deployment Strategies
description: CI/CD notes
date: 2023-11-01
---
```

## Routing

- `app/page.tsx` — root directory listing (reads `content/`)
- `app/[...path]/page.tsx` — catch-all route
  - Path resolves to directory -> Apache-style listing
  - Path resolves to MDX file -> reading view

Static generation via `generateStaticParams` walks the content tree at build time.

## Directory Listing UI

Faithful replica of Apache `mod_autoindex`:

- **Header**: `Index of /josephawallace.com/<path>/`
- **Columns**: Type icon, Name (linked), Last modified, Size, Description
- **Type icons**: `[DIR]`, `[TXT]`, `[PDF]`, `[IMG]`, `[CMP]`, `[ ]`
- **Sorting**: Client-side JavaScript, toggling asc/desc on column header click
- **Parent Directory**: Always first row, links to `../`
- **Footer**: `<hr>`, optional description, Apache server signature
- **Style**: System monospace font, white background, black text, blue underlined links

Metadata derived from:
- Name: filename
- Last modified: frontmatter `date`
- Size: file content byte length (human-readable)
- Description: frontmatter `description`
- Type: file extension mapping

## Reading View

Minimal monospace layout:
- Parent Directory link back to listing
- Page title from frontmatter
- Rendered MDX with basic formatting (headings, code blocks, lists)
- No sidebar, no fancy layout
- Same monospace font as directory listing

## Tech Stack

- Next.js 16 App Router with static generation
- MDX via `@next/mdx` or `next-mdx-remote`
- TypeScript
- Minimal CSS (no Tailwind utility classes in output — pure CSS matching Apache defaults)
- Bun as package manager

## Non-Goals

- No CMS integration
- No comments system
- No search
- No RSS feed (could add later)
- No dark mode (Apache doesn't have dark mode)
