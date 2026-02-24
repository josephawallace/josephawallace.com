# Apache Directory Blog Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a personal blog styled as an Apache directory listing, with MDX content, nested directory navigation, client-side sorting, and a monospace reading view.

**Architecture:** A `content/` directory holds MDX files mirroring URL paths. A catch-all route (`app/[...path]/page.tsx`) reads the filesystem at build time — directories render Apache-style listings, files render a monospace reading view. The root `app/page.tsx` renders the top-level listing.

**Tech Stack:** Next.js 16 App Router, `next-mdx-remote` for MDX rendering, TypeScript, plain CSS (no Tailwind in output)

---

### Task 1: Install Dependencies and Configure MDX

**Files:**
- Modify: `package.json`
- Modify: `next.config.ts`

**Step 1: Install next-mdx-remote and gray-matter**

Run: `bun add next-mdx-remote gray-matter`

**Step 2: Verify installation**

Run: `bun run build`
Expected: Build succeeds with no errors

**Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "feat: add next-mdx-remote and gray-matter dependencies"
```

---

### Task 2: Create Content Utility Library

**Files:**
- Create: `lib/content.ts`

**Step 1: Create `lib/content.ts`**

This module provides all content-reading functions used by pages. It reads the `content/` directory, parses frontmatter, and returns structured data for directory listings and post rendering.

```typescript
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content");

export interface DirectoryEntry {
  name: string;
  isDirectory: boolean;
  extension: string;
  date: string; // YYYY-MM-DD
  size: number; // bytes
  description: string;
  href: string;
}

export interface PostData {
  title: string;
  description: string;
  date: string;
  content: string; // raw MDX string
  slug: string;
}

/**
 * Map file extension to Apache-style type indicator.
 */
export function getTypeIndicator(entry: DirectoryEntry): string {
  if (entry.isDirectory) return "[DIR]";
  const ext = entry.extension.toLowerCase();
  const map: Record<string, string> = {
    ".mdx": "[TXT]",
    ".md": "[TXT]",
    ".txt": "[TXT]",
    ".pdf": "[PDF]",
    ".png": "[IMG]",
    ".jpg": "[IMG]",
    ".jpeg": "[IMG]",
    ".gif": "[IMG]",
    ".svg": "[IMG]",
    ".tar.gz": "[CMP]",
    ".zip": "[CMP]",
    ".gz": "[CMP]",
  };
  return map[ext] || "[ ]";
}

/**
 * Format byte size to human-readable string like Apache does.
 */
export function formatSize(bytes: number): string {
  if (bytes === 0) return "0";
  if (bytes < 1024) return `${bytes}`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)}M`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(0)}G`;
}

/**
 * Read a directory and return structured entries for the listing.
 * contentPath is relative to CONTENT_DIR, e.g. "" for root, "archives" for archives/.
 */
export function readDirectory(contentPath: string): DirectoryEntry[] {
  const fullPath = path.join(CONTENT_DIR, contentPath);

  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
    return [];
  }

  const items = fs.readdirSync(fullPath);
  const entries: DirectoryEntry[] = [];

  for (const item of items) {
    const itemPath = path.join(fullPath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      entries.push({
        name: item + "/",
        isDirectory: true,
        extension: "",
        date: getDirectoryDate(itemPath),
        size: 0,
        description: getDirectoryDescription(itemPath),
        href: "/" + path.join(contentPath, item),
      });
    } else if (item.endsWith(".mdx") || item.endsWith(".md")) {
      const raw = fs.readFileSync(itemPath, "utf-8");
      const { data } = matter(raw);
      const displayName = item;
      const slug = item.replace(/\.mdx?$/, "");

      entries.push({
        name: displayName,
        isDirectory: false,
        extension: path.extname(item),
        date: data.date
          ? new Date(data.date).toISOString().split("T")[0]
          : stat.mtime.toISOString().split("T")[0],
        size: Buffer.byteLength(raw, "utf-8"),
        description: data.description || "",
        href: "/" + path.join(contentPath, slug),
      });
    }
  }

  return entries;
}

/**
 * Get the most recent date from files in a directory (for directory listing date).
 */
function getDirectoryDate(dirPath: string): string {
  const items = fs.readdirSync(dirPath);
  let latestDate = new Date(0);

  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);
    if (!stat.isDirectory() && (item.endsWith(".mdx") || item.endsWith(".md"))) {
      const raw = fs.readFileSync(itemPath, "utf-8");
      const { data } = matter(raw);
      const d = data.date ? new Date(data.date) : stat.mtime;
      if (d > latestDate) latestDate = d;
    }
  }

  return latestDate.getTime() === 0
    ? new Date().toISOString().split("T")[0]
    : latestDate.toISOString().split("T")[0];
}

/**
 * Get directory description from an index.mdx file if it exists.
 */
function getDirectoryDescription(dirPath: string): string {
  const indexPath = path.join(dirPath, "index.mdx");
  if (fs.existsSync(indexPath)) {
    const raw = fs.readFileSync(indexPath, "utf-8");
    const { data } = matter(raw);
    return data.description || "";
  }
  return "";
}

/**
 * Read a single post by its content-relative path (without extension).
 * E.g. "deployment-strategies" or "archives/old-post".
 */
export function readPost(contentPath: string): PostData | null {
  const mdxPath = path.join(CONTENT_DIR, contentPath + ".mdx");
  const mdPath = path.join(CONTENT_DIR, contentPath + ".md");

  const filePath = fs.existsSync(mdxPath) ? mdxPath : fs.existsSync(mdPath) ? mdPath : null;

  if (!filePath) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    title: data.title || path.basename(contentPath),
    description: data.description || "",
    date: data.date
      ? new Date(data.date).toISOString().split("T")[0]
      : "",
    content,
    slug: contentPath,
  };
}

/**
 * Check if a content path is a directory.
 */
export function isDirectory(contentPath: string): boolean {
  const fullPath = path.join(CONTENT_DIR, contentPath);
  return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
}

/**
 * Check if a content path resolves to a post file.
 */
export function isPost(contentPath: string): boolean {
  const mdxPath = path.join(CONTENT_DIR, contentPath + ".mdx");
  const mdPath = path.join(CONTENT_DIR, contentPath + ".md");
  return fs.existsSync(mdxPath) || fs.existsSync(mdPath);
}

/**
 * Walk the entire content tree and return all paths for generateStaticParams.
 * Returns both directory paths and post paths (without extensions).
 */
export function getAllPaths(): string[][] {
  const paths: string[][] = [];

  function walk(dir: string, segments: string[]) {
    const items = fs.readdirSync(path.join(CONTENT_DIR, dir));

    for (const item of items) {
      const itemPath = path.join(CONTENT_DIR, dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        const newSegments = [...segments, item];
        paths.push(newSegments);
        walk(path.join(dir, item), newSegments);
      } else if (item.endsWith(".mdx") || item.endsWith(".md")) {
        const slug = item.replace(/\.mdx?$/, "");
        paths.push([...segments, slug]);
      }
    }
  }

  walk("", []);
  return paths;
}
```

**Step 2: Commit**

```bash
git add lib/content.ts
git commit -m "feat: add content utility library for reading MDX files and directories"
```

---

### Task 3: Create Sample Content

**Files:**
- Create: `content/hello-world.mdx`
- Create: `content/deployment-strategies.mdx`
- Create: `content/archives/index.mdx`
- Create: `content/archives/old-post.mdx`

**Step 1: Create content directory and sample files**

`content/hello-world.mdx`:
```mdx
---
title: Hello World
description: First post
date: 2026-02-23
---

# Hello World

This is the first post on the blog. Welcome to josephawallace.com.

## What is this?

A personal blog styled as an Apache directory listing. Because why not.
```

`content/deployment-strategies.mdx`:
```mdx
---
title: Deployment Strategies
description: CI/CD notes
date: 2026-02-20
---

# Deployment Strategies

Notes on various deployment strategies and CI/CD pipelines.

## Blue-Green Deployments

Run two identical production environments. Switch traffic between them.

## Canary Releases

Roll out changes to a small subset of users before full deployment.
```

`content/archives/index.mdx`:
```mdx
---
title: Archives
description: Old posts
---
```

`content/archives/old-post.mdx`:
```mdx
---
title: An Old Post
description: From the archives
date: 2025-06-15
---

# An Old Post

This is an archived post from a while ago.
```

**Step 2: Commit**

```bash
git add content/
git commit -m "feat: add sample MDX content files"
```

---

### Task 4: Create Apache Directory Listing Component

**Files:**
- Create: `components/DirectoryListing.tsx`

**Step 1: Create the component**

This is the core UI component that renders the Apache-style directory listing. It's a client component because it handles sorting state.

```tsx
"use client";

import { useState } from "react";
import type { DirectoryEntry } from "@/lib/content";
import { getTypeIndicator, formatSize } from "@/lib/content";

type SortColumn = "name" | "date" | "size" | "description";
type SortOrder = "asc" | "desc";

interface DirectoryListingProps {
  path: string; // e.g. "/" or "/archives/"
  entries: DirectoryEntry[];
}

export default function DirectoryListing({ path, entries }: DirectoryListingProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  }

  const sorted = [...entries].sort((a, b) => {
    // Directories always come first
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;

    let cmp = 0;
    switch (sortColumn) {
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "date":
        cmp = a.date.localeCompare(b.date);
        break;
      case "size":
        cmp = a.size - b.size;
        break;
      case "description":
        cmp = a.description.localeCompare(b.description);
        break;
    }
    return sortOrder === "asc" ? cmp : -cmp;
  });

  const indicator = (col: SortColumn) => {
    if (sortColumn !== col) return "";
    return sortOrder === "asc" ? " ▲" : " ▼";
  };

  const displayPath = path === "/" ? "/josephawallace.com/" : `/josephawallace.com${path}`;
  const parentHref = path === "/" ? null : "/" + path.split("/").filter(Boolean).slice(0, -1).join("/");

  return (
    <div className="directory-listing">
      <h1>Index of {displayPath}</h1>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>
              <a href="#" onClick={(e) => { e.preventDefault(); handleSort("name"); }}>
                Name{indicator("name")}
              </a>
            </th>
            <th>
              <a href="#" onClick={(e) => { e.preventDefault(); handleSort("date"); }}>
                Last modified{indicator("date")}
              </a>
            </th>
            <th>
              <a href="#" onClick={(e) => { e.preventDefault(); handleSort("size"); }}>
                Size{indicator("size")}
              </a>
            </th>
            <th>
              <a href="#" onClick={(e) => { e.preventDefault(); handleSort("description"); }}>
                Description{indicator("description")}
              </a>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr><td colSpan={5}><hr /></td></tr>
          {parentHref !== null && (
            <tr>
              <td>[PARENTDIR]</td>
              <td><a href={parentHref || "/"}>Parent Directory</a></td>
              <td></td>
              <td>-</td>
              <td></td>
            </tr>
          )}
          {sorted.map((entry) => (
            <tr key={entry.name}>
              <td>{getTypeIndicator(entry)}</td>
              <td><a href={entry.href}>{entry.name}</a></td>
              <td>{entry.date}</td>
              <td className="size-col">{entry.isDirectory ? "-" : formatSize(entry.size)}</td>
              <td>{entry.description}</td>
            </tr>
          ))}
          <tr><td colSpan={5}><hr /></td></tr>
        </tbody>
      </table>
      <address>Apache/2.4.54 (Unix) OpenSSL/1.1.1t Server at josephawallace.com Port 443</address>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/DirectoryListing.tsx
git commit -m "feat: add Apache-style directory listing component"
```

---

### Task 5: Create Post Reading View Component

**Files:**
- Create: `components/PostView.tsx`

**Step 1: Create the component**

```tsx
import { MDXRemote } from "next-mdx-remote/rsc";
import type { PostData } from "@/lib/content";

interface PostViewProps {
  post: PostData;
  parentPath: string; // e.g. "/" or "/archives"
}

export default function PostView({ post, parentPath }: PostViewProps) {
  return (
    <div className="post-view">
      <div className="post-nav">
        <a href={parentPath}>Parent Directory</a>
      </div>
      <article className="post-content">
        <h1>{post.title}</h1>
        {post.date && <p className="post-date">{post.date}</p>}
        <MDXRemote source={post.content} />
      </article>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/PostView.tsx
git commit -m "feat: add monospace post reading view component"
```

---

### Task 6: Replace Global Styles with Apache-Style CSS

**Files:**
- Modify: `app/globals.css`

**Step 1: Replace globals.css**

Replace the entire contents of `app/globals.css` with plain CSS that mimics Apache's default directory listing style. No Tailwind imports.

```css
/* Apache directory listing style */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: monospace;
  font-size: 13px;
  line-height: 1.4;
  background: #ffffff;
  color: #000000;
  padding: 8px;
}

a {
  color: #0000ee;
  text-decoration: underline;
}

a:visited {
  color: #551a8b;
}

a:hover {
  color: #0000ee;
}

/* Directory listing */

.directory-listing h1 {
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 0.5em;
  font-family: monospace;
}

.directory-listing table {
  border-collapse: collapse;
  width: 100%;
  font-family: monospace;
  font-size: 13px;
}

.directory-listing th {
  text-align: left;
  font-weight: normal;
  padding: 0 8px;
  white-space: nowrap;
}

.directory-listing th a {
  color: #0000ee;
  text-decoration: underline;
  cursor: pointer;
}

.directory-listing td {
  padding: 0 8px;
  white-space: nowrap;
  vertical-align: top;
}

.directory-listing td.size-col {
  text-align: right;
}

.directory-listing hr {
  border: none;
  border-top: 1px solid #000000;
  margin: 2px 0;
}

.directory-listing address {
  font-style: italic;
  font-size: 12px;
  margin-top: 8px;
}

/* Post reading view */

.post-view {
  max-width: 80ch;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.6;
}

.post-nav {
  margin-bottom: 16px;
}

.post-content h1 {
  font-size: 1.5em;
  font-weight: bold;
  margin: 16px 0 8px;
  font-family: monospace;
}

.post-content h2 {
  font-size: 1.3em;
  font-weight: bold;
  margin: 16px 0 8px;
  font-family: monospace;
}

.post-content h3 {
  font-size: 1.1em;
  font-weight: bold;
  margin: 12px 0 6px;
  font-family: monospace;
}

.post-content p {
  margin: 8px 0;
}

.post-content .post-date {
  color: #666666;
  margin-bottom: 16px;
}

.post-content ul,
.post-content ol {
  margin: 8px 0;
  padding-left: 24px;
}

.post-content li {
  margin: 4px 0;
}

.post-content pre {
  background: #f5f5f5;
  padding: 8px;
  overflow-x: auto;
  margin: 8px 0;
  border: 1px solid #cccccc;
}

.post-content code {
  font-family: monospace;
  font-size: 13px;
}

.post-content blockquote {
  border-left: 3px solid #cccccc;
  padding-left: 12px;
  margin: 8px 0;
  color: #555555;
}

.post-content a {
  color: #0000ee;
  text-decoration: underline;
}

.post-content hr {
  border: none;
  border-top: 1px solid #cccccc;
  margin: 16px 0;
}
```

**Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat: replace Tailwind styles with Apache directory listing CSS"
```

---

### Task 7: Update Root Layout

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Simplify layout.tsx**

Remove Geist fonts and Tailwind class names. Set metadata to match the blog.

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Index of /josephawallace.com/",
  description: "Personal blog of Joseph Wallace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: simplify root layout for Apache-style blog"
```

---

### Task 8: Create Root Page (Top-Level Directory Listing)

**Files:**
- Modify: `app/page.tsx`

**Step 1: Replace page.tsx with root directory listing**

```tsx
import DirectoryListing from "@/components/DirectoryListing";
import { readDirectory } from "@/lib/content";

export default function Home() {
  const entries = readDirectory("");

  return <DirectoryListing path="/" entries={entries} />;
}
```

**Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: replace home page with root directory listing"
```

---

### Task 9: Create Catch-All Route

**Files:**
- Create: `app/[...path]/page.tsx`

**Step 1: Create the catch-all route**

```tsx
import { notFound } from "next/navigation";
import DirectoryListing from "@/components/DirectoryListing";
import PostView from "@/components/PostView";
import { readDirectory, readPost, isDirectory, isPost, getAllPaths } from "@/lib/content";

interface PageProps {
  params: Promise<{ path: string[] }>;
}

export async function generateStaticParams() {
  const paths = getAllPaths();
  return paths.map((path) => ({ path }));
}

export default async function CatchAllPage({ params }: PageProps) {
  const { path } = await params;
  const contentPath = path.join("/");

  if (isDirectory(contentPath)) {
    const entries = readDirectory(contentPath);
    return <DirectoryListing path={`/${contentPath}/`} entries={entries} />;
  }

  if (isPost(contentPath)) {
    const post = readPost(contentPath);
    if (!post) notFound();

    const parentSegments = path.slice(0, -1);
    const parentPath = parentSegments.length === 0 ? "/" : "/" + parentSegments.join("/");

    return <PostView post={post} parentPath={parentPath} />;
  }

  notFound();
}
```

**Step 2: Commit**

```bash
git add app/\[...path\]/page.tsx
git commit -m "feat: add catch-all route for directories and posts"
```

---

### Task 10: Remove Unused Files and Tailwind Config

**Files:**
- Delete: `public/next.svg`
- Delete: `public/vercel.svg`
- Delete: `public/file.svg`
- Delete: `public/globe.svg`
- Delete: `public/window.svg`
- Modify: `postcss.config.mjs` (remove Tailwind plugin or delete file)

**Step 1: Clean up unused assets and config**

```bash
rm public/next.svg public/vercel.svg public/file.svg public/globe.svg public/window.svg
```

Remove the Tailwind import from globals.css if still present (should already be gone from Task 6).

Update `postcss.config.mjs` to be empty or remove Tailwind:

```js
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {},
};

export default config;
```

**Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove unused assets and Tailwind configuration"
```

---

### Task 11: Build and Verify

**Step 1: Run the build**

Run: `bun run build`
Expected: Build succeeds, all pages statically generated

**Step 2: Run dev server and verify visually**

Run: `bun run dev`

Check:
- `http://localhost:3000` shows Apache-style directory listing with sample posts
- `http://localhost:3000/archives` shows archives subdirectory listing
- `http://localhost:3000/hello-world` renders the post in monospace
- Column header sorting works
- Parent Directory links work

**Step 3: Commit any fixes if needed**

---

### Task 12: Final Polish and Commit

**Step 1: Run linter**

Run: `bun run lint`
Fix any issues.

**Step 2: Final commit if any changes**

```bash
git add -A
git commit -m "chore: lint fixes and final polish"
```
