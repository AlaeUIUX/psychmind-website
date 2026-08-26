import type { Metadata } from "next";
import { MissionArticle } from "@/components/mission/article";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Our mission — PsychMind",
  description: "The home for your mind's wellbeing.",
};

export default function MissionPage() {
  return (
    <Reveal>
      <MissionArticle />
    </Reveal>
  );
}
