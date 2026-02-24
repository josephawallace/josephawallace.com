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
