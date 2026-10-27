// Figma has three "Review" instances (nodes 112:227/246/270) — same layout,
// three pastel variants. Only one had real copy ("Sara A."); the other two
// are placeholder quotes in the same voice until real testimonials come in.
export type Review = {
  quote: string;
  /** "Name - context", e.g. "Sara A. - Needed help with ADHD". */
  author: string;
};

export const reviews: Review[] = [
  {
    quote:
      "I was nervous about the whole thing but being able to message the provider first made it so much easier.",
    author: "Sara A. - Needed help with ADHD",
  },
  {
    quote:
      "Finding a provider who actually specialized in what I needed took ten minutes instead of ten phone calls.",
    author: "Marcus T. - Needed help with anxiety",
  },
  {
    quote:
      "I liked being able to read a provider's approach before ever reaching out. It made the first message so much less scary.",
    author: "Priya K. - Needed help with burnout",
  },
];
