// Figma has three "Review" instances (nodes 112:227/246/270) — same layout,
// three pastel variants. Only one had real copy ("Sara A."); the other two
// are placeholder quotes in the same voice until real testimonials come in.
export type Review = {
  quote: string;
  author: string;
  bg: string;
  leftDoodle: string;
  leftRatio: string;
  rightDoodle: string;
  rightRatio: string;
};

export const reviews: Review[] = [
  {
    quote:
      "I was nervous about the whole thing but being able to message the provider first made it so much easier.",
    author: "Sara A. - Needed help with ADHD",
    bg: "#ffffe9",
    leftDoodle: "/images/home/testimonial-doodle-left.png",
    leftRatio: "478 / 570",
    rightDoodle: "/images/home/testimonial-doodle-right.png",
    rightRatio: "397 / 472",
  },
  {
    quote:
      "Finding a provider who actually specialized in what I needed took ten minutes instead of ten phone calls.",
    author: "Marcus T. - Needed help with anxiety",
    bg: "#e9fff3",
    leftDoodle: "/images/home/testimonial-doodle-left-green.png",
    leftRatio: "478 / 569",
    rightDoodle: "/images/home/testimonial-doodle-right-green.png",
    rightRatio: "396 / 472",
  },
  {
    quote:
      "I liked being able to read a provider's approach before ever reaching out. It made the first message so much less scary.",
    author: "Priya K. - Needed help with burnout",
    bg: "#f5f5fb",
    leftDoodle: "/images/home/testimonial-doodle-left-purple.png",
    leftRatio: "461 / 558",
    rightDoodle: "/images/home/testimonial-doodle-right-purple.png",
    rightRatio: "385 / 463",
  },
];
