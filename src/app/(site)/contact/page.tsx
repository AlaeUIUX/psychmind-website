import type { Metadata } from "next";
import { Hero } from "@/components/contact/hero";
import { ContactForm } from "@/components/contact/contact-form";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Contact — PsychMind",
  description:
    "Whether you have a question, a thought, or just want to say hello — reach out to the PsychMind team.",
};

export default function ContactPage() {
  return (
    <>
      <Reveal>
        <Hero />
      </Reveal>
      <Reveal>
        <ContactForm />
      </Reveal>
    </>
  );
}
