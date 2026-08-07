import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export type PostFrontmatter = {
  title: string;
  excerpt: string;
  category: string;
  author: string;
  authorTitle?: string;
  authorAvatar?: string;
  date: string;
  readTime: string;
  heroImage?: string;
  thumbnail?: string;
  featured?: boolean;
};

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
