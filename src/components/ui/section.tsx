import { cn } from "cn";
import type { ComponentProps } from "react";

// Layout rhythm for every page:
// - <Section> owns the page gutter (16 → 32 → 48px) and vertical spacing.
// - <Container> owns the column width. Three widths only:
//     prose   720px  — articles, hero text, legal
//     content 1052px — the main content column (header aligns to it too)
//     wide    1240px — feature panels that intentionally break the column

const spacing = {
  none: "",
  sm: "py-10 sm:py-12 md:py-14",
  md: "py-14 sm:py-16 md:py-20",
  lg: "py-16 sm:py-24 md:py-32",
} as const;

export const GUTTER = "px-4 sm:px-8 lg:px-12";

type SectionProps = ComponentProps<"section"> & {
  spacing?: keyof typeof spacing;
};

export function Section({ spacing: space = "md", className, ...props }: SectionProps) {
  return <section className={cn("w-full", GUTTER, spacing[space], className)} {...props} />;
}

const widths = {
  prose: "max-w-[720px]",
  content: "max-w-[1052px]",
  wide: "max-w-[1240px]",
} as const;

type ContainerProps = ComponentProps<"div"> & {
  size?: keyof typeof widths;
};

export function Container({ size = "content", className, ...props }: ContainerProps) {
  return <div className={cn("mx-auto w-full", widths[size], className)} {...props} />;
}
