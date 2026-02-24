import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content");

export interface DirectoryEntry {
  name: string;
  isDirectory: boolean;
  extension: string;
  date: string;
  size: number;
  description: string;
  href: string;
}

export interface PostData {
  title: string;
  description: string;
  date: string;
  content: string;
  slug: string;
}

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

export function formatSize(bytes: number): string {
  if (bytes === 0) return "0";
  if (bytes < 1024) return `${bytes}`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)}M`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(0)}G`;
}

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
      const slug = item.replace(/\.mdx?$/, "");

      entries.push({
        name: item,
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

function getDirectoryDescription(dirPath: string): string {
  const indexPath = path.join(dirPath, "index.mdx");
  if (fs.existsSync(indexPath)) {
    const raw = fs.readFileSync(indexPath, "utf-8");
    const { data } = matter(raw);
    return data.description || "";
  }
  return "";
}

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

export function isDirectory(contentPath: string): boolean {
  const fullPath = path.join(CONTENT_DIR, contentPath);
  return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
}

export function isPost(contentPath: string): boolean {
  const mdxPath = path.join(CONTENT_DIR, contentPath + ".mdx");
  const mdPath = path.join(CONTENT_DIR, contentPath + ".md");
  return fs.existsSync(mdxPath) || fs.existsSync(mdPath);
}

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
