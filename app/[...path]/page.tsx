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
