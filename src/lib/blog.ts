import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export type PostFrontmatter = {
  title: string;
  excerpt: string;
  category: string;
  /** Who wrote it: the PsychMind team, or a provider on PsychMind (the blog's two lists). */
  source?: PostSource;
  author: string;
  authorTitle?: string;
  authorAvatar?: string;
  date: string;
  readTime: string;
  heroImage?: string;
  /** Use a built-in vector doodle as the lead art instead of `heroImage`. */
  art?: "magnifier";
  thumbnail?: string;
  featured?: boolean;
};

export type PostSource = "team" | "provider";

export type Post = PostFrontmatter & { slug: string };

export function getAllPosts(): Post[] {
  const files = fs.readdirSync(BLOG_DIR).filter((file) => file.endsWith(".md"));
  const posts = files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data } = matter(raw);
    return { slug, ...(data as PostFrontmatter) };
  });
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): { frontmatter: Post; content: string } | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { frontmatter: { slug, ...(data as PostFrontmatter) }, content };
}

export type IndexedPost = Post & {
  source: PostSource;
  /** Its place in the blog, counting from the oldest (001). */
  number: number;
  year: number;
};

const postTime = (post: Post) => Date.parse(post.date) || 0;

/** Every post, newest first, with its number (the oldest is 001) and its year: the
 *  blog index (after theboringblog.ai's, grouped by year) and a post's "Next". */
export function getPostIndex(): IndexedPost[] {
  const posts = getAllPosts();
  const oldest = [...posts].sort((a, b) => postTime(a) - postTime(b) || a.title.localeCompare(b.title));
  const number = new Map(oldest.map((post, i) => [post.slug, i + 1]));
  return oldest
    .map((post) => ({
      ...post,
      source: post.source ?? "team",
      number: number.get(post.slug)!,
      year: new Date(postTime(post)).getFullYear(),
    }))
    .reverse();
}
