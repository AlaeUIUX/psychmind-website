import { Hero } from "@/components/home/hero";
import { ProductLoop } from "@/components/home/product-loop";
import { VerifiedProviders } from "@/components/home/verified-providers";
import { Reviews } from "@/components/home/reviews";
import { Voyage } from "@/components/home/voyage";
import { MissionTeaser } from "@/components/home/mission-teaser";
import { ResourcePreview } from "@/components/home/resource-preview";
import { ProviderBand } from "@/components/home/provider-band";
import { HomeFaq } from "@/components/home/home-faq";
import { SearchShortcut } from "@/components/home/search-shortcut";

// Running order: the search (with its trust row) and the boat, whose story voices
// the questions people carry in → the product loop that answers them → the people
// behind it → what others say → her boat sailing on down → why it exists → learning → providers → FAQ & crisis help.
export default function Home() {
  return (
    <>
      <Hero />
      <ProductLoop />
      <VerifiedProviders />
      <Reviews />
      <Voyage />
      <MissionTeaser />
      <ResourcePreview />
      <ProviderBand />
      <HomeFaq />
      <SearchShortcut />
    </>
  );
}
