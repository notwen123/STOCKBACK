import { Hero } from "@/components/landing/Hero";
import { Journey } from "@/components/landing/Journey";
import { KineticType } from "@/components/landing/KineticType";
import { LiveProof } from "@/components/landing/LiveProof";
import { FinalCta, Ownership, Security, StylusSection } from "@/components/landing/Sections";

export default function Landing() {
  return (
    <>
      <Hero />
      <LiveProof />
      <Journey />
      <KineticType />
      <StylusSection />
      <Ownership />
      <Security />
      <FinalCta />
    </>
  );
}
