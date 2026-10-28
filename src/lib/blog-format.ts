/** A post's number as the blog shows it: three digits, the oldest 001 (lib/blog.ts). */
export const postNumber = (n: number) => String(n).padStart(3, "0");
