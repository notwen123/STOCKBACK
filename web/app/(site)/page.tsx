import { Hero } from "@/components/landing/Hero";
import { FinalCta, HowItWorks, Ownership, PortfolioPreview, Problem, Security, StylusSection, TechnicalProof } from "@/components/landing/Sections";

export default function Landing() {
  return (
    <>
      <Hero />
      <Problem />
      <HowItWorks />
      <TechnicalProof />
      <StylusSection />
      <Ownership />
      <PortfolioPreview />
      <Security />
      <FinalCta />
    </>
  );
}
