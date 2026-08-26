// Figma has three "Review" instances (nodes 112:227/246/270) — same layout,
// three pastel variants. Only one had real copy ("Sara A."); the other two
// are placeholder quotes in the same voice until real testimonials come in.
// Cards are solid color for now (no corner artwork) until real imagery is ready.
export type Review = {
  quote: string;
  author: string;
  bg: string;
};

export const reviews: Review[] = [
  {
    quote:
      "I was nervous about the whole thing but being able to message the provider first made it so much easier.",
    author: "Sara A. - Needed help with ADHD",
    bg: "#ffffe9",
  },
  {
    quote:
      "Finding a provider who actually specialized in what I needed took ten minutes instead of ten phone calls.",
    author: "Marcus T. - Needed help with anxiety",
    bg: "#e9fff3",
  },
  {
    quote:
      "I liked being able to read a provider's approach before ever reaching out. It made the first message so much less scary.",
    author: "Priya K. - Needed help with burnout",
    bg: "#f5f5fb",
  },
];
