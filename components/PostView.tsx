import { MDXRemote } from "next-mdx-remote/rsc";
import type { PostData } from "@/lib/shared";
import Breadcrumb from "@/components/Breadcrumb";

interface PostViewProps {
  post: PostData;
  path: string;
  parentPath: string;
}

export default function PostView({ post, path, parentPath }: PostViewProps) {
  return (
    <div className="post-view">
      <Breadcrumb path={path} />
      <article className="post-content">
        {post.date && <p className="post-date">{post.date}</p>}
        <MDXRemote source={post.content} />
      </article>
    </div>
  );
}
