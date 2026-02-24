import { MDXRemote } from "next-mdx-remote/rsc";
import type { PostData } from "@/lib/content";

interface PostViewProps {
  post: PostData;
  parentPath: string;
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
