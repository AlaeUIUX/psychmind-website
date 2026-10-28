import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact/contact-form";
import { ContactScene } from "@/components/contact/contact-scene";

export const metadata: Metadata = {
  title: "Contact — PsychMind",
  description:
    "Whether you have a question, a thought, or just want to say hello — reach out to the PsychMind team.",
};

// The contact page as one screen, after interfere.com/join: the form in a calm column on
// the left, in the portal's form style (as the log-in pages are, auth-shell.tsx), and on
// the right a panel the height of the screen with the home hero's voyage in it. On
// phones the voyage follows the form as a band.
export default function ContactPage() {
  return (
    <div className="app-ui flex min-h-svh flex-col bg-white text-warm-900 lg:flex-row lg:p-3">
      <div className="flex min-h-svh w-full flex-col lg:min-h-0 lg:min-w-0 lg:flex-1">
        <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col">
          <header className="flex h-16 items-center px-6 sm:px-10">
            <Link href="/" className="flex items-center gap-2" aria-label="PsychMind home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/home/logo.svg" alt="" width={26} height={26} />
              <span className="font-display text-[19px] text-warm-900">PsychMind</span>
            </Link>
          </header>

          <main className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
            <div className="w-full max-w-[440px]">
              <ContactForm />
            </div>
          </main>

          <footer className="px-6 pb-6 text-[12px] text-warm-500 sm:px-10">
            <p>
              <Link href="/terms" className="hover:text-warm-800">
                Terms
              </Link>
              <span className="mx-1.5">·</span>
              <Link href="/privacy-policy" className="hover:text-warm-800">
                Privacy
              </Link>
              <span className="mx-1.5">·</span>© {new Date().getFullYear()} PsychMind
            </p>
          </footer>
        </div>
      </div>

      <div className="h-[360px] shrink-0 px-3 pb-3 sm:h-[440px] lg:sticky lg:top-3 lg:h-[calc(100svh-24px)] lg:w-[54%] lg:max-w-[900px] lg:p-0">
        <ContactScene />
      </div>
    </div>
  );
}
