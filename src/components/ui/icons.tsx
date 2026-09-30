import type { SVGProps } from "react";

// The site's UI icons, redrawn from the Figma exports with `currentColor` so
// they inherit color and size from whatever they sit in (buttons size them via
// `[&_svg]:size-*`). Illustrations and brand/social marks stay as image files.

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return { "aria-hidden": true, focusable: false, ...props } as const;
}

/** Filled circle with an up-right arrow cut out — the primary CTA icon.
 *  Inside a <Button> it rotates to point forward on hover. */
export function CircleArrowIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`group-hover/button:rotate-45 ${className ?? ""}`}
      {...base(props)}
    >
      <path d="M12 0C18.6275 0 24 5.37258 24 12C24 18.6275 18.6275 24 12 24C5.37258 24 0 18.6275 0 12C0 5.37258 5.37258 0 12 0ZM8.22363 7.31837V9.56837H12.4658L7.22754 14.8066L8.81837 16.3974L14.0566 11.1592V15.4014H16.3067V8.44337C16.3065 7.86101 15.8645 7.38048 15.2973 7.32276L15.1817 7.31837H8.22363Z" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...base(props)}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.25 9.75C2.25 5.60787 5.60787 2.25 9.75 2.25C13.8921 2.25 17.25 5.60787 17.25 9.75C17.25 13.8921 13.8921 17.25 9.75 17.25C5.60787 17.25 2.25 13.8921 2.25 9.75ZM9.75 0C4.36523 0 0 4.36523 0 9.75C0 15.1349 4.36523 19.5 9.75 19.5C12.037 19.5 14.1402 18.7125 15.803 17.394L20.9545 22.5455L21.75 23.3411L23.3411 21.75L22.5455 20.9545L17.394 15.803C18.7125 14.1402 19.5 12.037 19.5 9.75C19.5 4.36523 15.1349 0 9.75 0Z"
      />
    </svg>
  );
}

/** Paper plane — "Contact us" / "Send message". */
export function SendIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...base(props)}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22.1215 0.440552L1.12154 7.94055L1.09607 10.05L10.2238 13.5607C10.3229 13.5988 10.4011 13.6771 10.4392 13.7761L13.9499 22.9038L16.0594 22.8785L23.5594 1.87839L22.1215 0.440552ZM10.9714 11.4375L4.73539 9.03908L18.1668 4.24215L10.9714 11.4375ZM12.5624 13.0285L14.9608 19.2645L19.7578 5.83314L12.5624 13.0285Z"
      />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg viewBox="-0.2 -0.2 16 16" fill="none" stroke="currentColor" {...base(props)}>
      <path
        d="M5.37289 0.75H2.75074C1.50915 0.75 0.567575 1.86946 0.78031 3.09268L1.0213 4.47836C1.84167 9.1955 5.38764 12.9735 10.0434 14.0909L12.4062 14.658C13.6638 14.9598 14.8729 14.0066 14.8729 12.7132V10.25L11.6229 8L9.12289 10.5L5.12289 6.5L7.62289 4L5.37289 0.75Z"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <svg viewBox="-2 -2 16.3 16.3" fill="currentColor" {...base(props)}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.06066 0H3.31066V1.5H4.06066H9.74995L0.53033 10.7197L0 11.25L1.06066 12.3107L1.59099 11.7803L10.8095 2.56182V8.25V9H12.3095V8.25V1C12.3095 0.44772 11.8618 0 11.3095 0H4.06066Z"
      />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 18 18" fill="currentColor" {...base(props)}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.7216 2.49712L10.125 1.9005L8.93176 3.09374L9.52838 3.69036L13.9942 8.15624H1.96875H1.125V9.84374H1.96875H13.9942L9.52838 14.3096L8.93176 14.9062L10.125 16.0995L10.7216 15.5028L16.429 9.79548C16.8684 9.35614 16.8684 8.64383 16.429 8.20449L10.7216 2.49712Z"
      />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" {...base(props)}>
      <path d="M6 4L10 8L6 12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" {...base(props)}>
      <path d="M8 3.5V12.5M3.5 8H12.5" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
