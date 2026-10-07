"use client";

import "./globals.css";

// Last-resort error page when the root layout itself fails. It renders its own
// <html>, so it can't use the site's fonts or chrome; it stays plain, calm and
// always offers 988. TODO(client): copy.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-svh flex-col items-center justify-center gap-4 bg-warm-25 px-6 text-center font-sans text-text-primary">
        <h1 className="font-serif text-3xl">Something went wrong</h1>
        <p className="max-w-[440px] text-text-secondary">
          We hit an unexpected problem. Please try again. If you need to talk to someone right now, call or text 988.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="h-11 rounded-full bg-warm-900 px-5 font-medium text-white hover:bg-warm-800"
          >
            Try again
          </button>
          <a href="tel:988" className="flex h-11 items-center rounded-full border border-warm-200 bg-white px-5 font-medium">
            Call 988
          </a>
        </div>
      </body>
    </html>
  );
}
