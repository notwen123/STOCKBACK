import Image from "next/image";
import { Seal } from "@/components/art/Art";
import { BrandMark } from "@/components/brand/BrandMark";
import { Reveal, RevealLines } from "@/components/motion/Motion";
import { Arrow, ButtonLink, Eyebrow } from "@/components/ui/Button";
import { BRANDS } from "@/lib/brands";
import { getOnchainBenchmark } from "@/lib/benchmarks";
import { GITHUB_URL } from "@/lib/chain";
import { LivePortfolioPreview } from "./LivePortfolioPreview";

function SectionHead({ n, eyebrow, title, className }: { n: string; eyebrow: string; title: React.ReactNode[]; className?: string }) {
  return (
    <div className={className}>
      <Reveal>
        <p className="flex items-center gap-4 font-mono text-[0.7rem] uppercase tracking-[0.24em] text-muted">
          <span className="text-vermilion">{n}</span>
          <span className="h-px w-10 bg-ink/30" />
          {eyebrow}
        </p>
      </Reveal>
      <h2 className="mt-6 font-display text-[clamp(2.3rem,5.4vw,4.6rem)] font-bold leading-[1.02] tracking-[-0.01em]">
        <RevealLines lines={title} />
      </h2>
    </div>
  );
}

const Wrap = ({ children, className, id, label }: { children: React.ReactNode; className?: string; id?: string; label: string }) => (
  <section id={id} aria-label={label} className={`relative mx-auto max-w-[1320px] px-5 sm:px-8 ${className ?? ""}`}>
    {children}
  </section>
);

// 02 -------------------------------------------------------------------------
export function Problem() {
  const old = ["Buy", "Receipt", "Points", "Expire"];
  const next = ["Buy", "Prove", "Own"];
  return (
    <Wrap label="The problem" className="py-28 sm:py-40">
      <SectionHead n="02" eyebrow="The problem" title={["Your purchases create value.", "Why don't they create ownership?"]} />
      <div className="mt-20 grid gap-16 md:grid-cols-2 md:gap-10">
        <Reveal>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-muted">Loyalty today</p>
          <ol className="mt-6 space-y-0">
            {old.map((s, i) => (
              <li key={s} className="flex items-center gap-6 border-b border-ink/10 py-5">
                <span className="w-8 font-mono text-xs text-muted">0{i + 1}</span>
                <span className={`font-display text-3xl ${s === "Expire" ? "text-stone line-through decoration-vermilion/60" : "text-charcoal"}`}>{s}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-sm text-sm text-muted">Points stay closed-loop, lose value and quietly expire.</p>
        </Reveal>
        <Reveal delay={0.25}>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-vermilion-deep">With STOCKBACK</p>
          <ol className="mt-6">
            {next.map((s, i) => (
              <li key={s} className="flex items-center gap-6 border-b border-ink/15 py-5">
                <span className="w-8 font-mono text-xs text-vermilion">0{i + 1}</span>
                <span className="font-display text-5xl font-bold">{s}</span>
                {s === "Own" && <Seal size={30} className="ml-auto" />}
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-sm text-sm text-charcoal">A verified purchase becomes exposure to the brand you actually buy from.</p>
        </Reveal>
      </div>
    </Wrap>
  );
}

// 03 -------------------------------------------------------------------------
export function HowItWorks() {
  const steps = [
    ["01", "Scan", "Capture a purchase. The receipt stays with you. Only hashed details ever leave the attester."],
    ["02", "Prove", "An attested claim is verified on-chain: signature, replay check and eligibility, in one transaction."],
    ["03", "Own", "Receive eligible ownership exposure as shares of the brand's ERC-4626 vault."],
  ];
  return (
    <div className="border-y border-ink/10 bg-paper-dark/40">
      <Wrap label="How it works" className="py-28 sm:py-36">
        <SectionHead n="03" eyebrow="How it works" title={["Three movements."]} />
        <ol className="mt-20 grid gap-14 md:grid-cols-3 md:gap-10">
          {steps.map(([n, t, d], i) => (
            <Reveal as="li" key={n} delay={i * 0.15}>
              <span className="block font-display text-[7rem] font-extrabold leading-none text-transparent [-webkit-text-stroke:1.2px_var(--stockback-ink)]" aria-hidden="true">
                {n}
              </span>
              <h3 className="mt-4 font-display text-4xl font-bold">{t}</h3>
              <div className="mt-4 h-px w-12 bg-vermilion" />
              <p className="mt-5 max-w-xs leading-relaxed text-charcoal">{d}</p>
            </Reveal>
          ))}
        </ol>
        <Reveal className="mt-16">
          <ButtonLink href="/how-it-works" variant="quiet">
            The full ten-stage walkthrough <Arrow />
          </ButtonLink>
        </Reveal>
      </Wrap>
    </div>
  );
}

// 04 -------------------------------------------------------------------------
const PIPE = [
  ["Evidence", "Your receipt, off-chain"],
  ["Attestation", "An attester signs the claim"],
  ["Commitment", "EIP-712 hash, no personal data"],
  ["Nullifier", "Each receipt counts once"],
  ["Stylus verification", "Ed25519 in Rust"],
  ["Reward policy", "Rates, caps, budget"],
  ["Brand vault", "ERC-4626 shares to you"],
];

export function TechnicalProof() {
  return (
    <Wrap label="Technical proof" className="py-28 sm:py-40">
      <SectionHead n="04" eyebrow="Under one transaction" title={["Proof, not promises."]} />
      <Reveal className="mt-6 max-w-xl text-charcoal">
        <p>Every claim passes the same seven gates. If any gate fails, nothing happens and no reward moves.</p>
      </Reveal>
      <ol className="relative mt-16 grid gap-0 md:grid-cols-7">
        <div className="absolute left-[11px] top-3 h-[calc(100%-24px)] w-px bg-ink/20 md:left-0 md:top-[11px] md:h-px md:w-full" aria-hidden="true" />
        {PIPE.map(([t, d], i) => (
          <Reveal as="li" key={t} delay={i * 0.09} className="relative flex gap-5 pb-10 md:block md:pb-0 md:pr-4">
            <span className={`relative z-10 mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${i === 4 ? "border-vermilion bg-vermilion" : "border-ink bg-paper"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${i === 4 ? "bg-paper" : "bg-ink"}`} />
            </span>
            <div className="md:mt-6">
              <p className="font-mono text-[0.65rem] text-muted">0{i + 1}</p>
              <h3 className="mt-1 font-display text-xl font-bold leading-tight">{t}</h3>
              <p className="mt-2 text-sm text-muted">{d}</p>
            </div>
          </Reveal>
        ))}
      </ol>
      <Reveal className="mt-14">
        <details className="group border-t border-ink/15 pt-6">
          <summary className="flex cursor-pointer list-none items-center justify-between font-mono text-xs uppercase tracking-[0.22em] text-charcoal">
            Under the hood
            <span className="text-lg transition-transform duration-300 group-open:rotate-45" aria-hidden="true">+</span>
          </summary>
          <dl className="mt-6 grid gap-6 text-sm md:grid-cols-2">
            {[
              ["Claim ID", "EIP-712 struct hash of (claimant, brand, merchant hash, salted receipt hash, amount, currency, time, deadline), domain-bound to chain 46630 and the registry."],
              ["Nullifier", "keccak256(tag, merchantId, receiptHash). Independent of wallet and amount, so a receipt can't be replayed under new terms."],
              ["Verifier", "IReceiptVerifier.verify(bytes32 digest, bytes attestation) → bool. The active verifier is a Stylus contract checking a strict Ed25519 signature."],
              ["Reward", "amount × rate × multiplier, clipped to a per-claim cap; per-wallet and per-brand daily caps; paid only from sponsor-funded budget."],
              ["Ownership", "RewardPool deposits into the brand's admin-less ERC-4626 vault on your behalf. Only you can redeem your shares."],
              ["Privacy", "Raw receipts, UPI IDs, names and phone numbers never go on-chain. Receipt references are salted before hashing."],
            ].map(([k, v]) => (
              <div key={k} className="border-l border-vermilion/40 pl-4">
                <dt className="font-semibold">{k}</dt>
                <dd className="mt-1 leading-relaxed text-charcoal">{v}</dd>
              </div>
            ))}
          </dl>
        </details>
      </Reveal>
    </Wrap>
  );
}

// 05 -------------------------------------------------------------------------
const fmt = (n: number) => n.toLocaleString("en-US");

export async function StylusSection() {
  const bench = await getOnchainBenchmark();
  const max = bench ? Math.max(...bench.rows.flatMap((r) => [r.solidity ?? 32_000_000, r.stylus ?? 0])) : 1;
  return (
    <div className="bg-ink text-paper">
      <Wrap label="Why Stylus" className="py-28 sm:py-40">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <Reveal>
              <p className="flex items-center gap-4 font-mono text-[0.7rem] uppercase tracking-[0.24em] text-stone">
                <span className="text-vermilion">05</span>
                <span className="h-px w-10 bg-paper/30" />
                Why Rust?
              </p>
            </Reveal>
            <h2 className="mt-6 font-display text-[clamp(2.3rem,5.4vw,4.6rem)] font-bold leading-[1.02]">
              <RevealLines lines={["Verification the", "EVM can't do alone."]} />
            </h2>
            <Reveal className="mt-8 max-w-md space-y-4 leading-relaxed text-paper/80">
              <p>
                Attesters sign purchases with Ed25519. The EVM has no Ed25519 precompile, so Solidity must emulate SHA-512 and curve
                arithmetic in bytecode.
              </p>
              <p>STOCKBACK verifies those signatures in compiled Rust on Arbitrum Stylus, and keeps settlement and accounting in Solidity.</p>
              <p className="text-sm text-stone">
                Standard Ethereum signatures (ECDSA) remain cheaper than both. Stylus earns its place specifically for signatures the EVM lacks.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            {bench ? (
              <figure>
                <figcaption className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-stone">
                  Gas to verify N attestations · measured on Robinhood Chain testnet
                </figcaption>
                <div className="mt-8 space-y-7">
                  {bench.rows.map((r) => (
                    <div key={r.batch}>
                      <div className="flex items-baseline justify-between font-mono text-xs text-stone">
                        <span>
                          {r.batch} {r.batch === 1 ? "signature" : "signatures"}
                        </span>
                        {r.solidity && r.stylus && <span className="text-paper">{(r.solidity / r.stylus).toFixed(1)}× less gas with Stylus</span>}
                      </div>
                      <div className="mt-2 space-y-1.5">
                        <Bar label="Solidity" value={r.solidity} max={max} tone="stone" />
                        <Bar label="Stylus" value={r.stylus} max={max} tone="red" />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-8 text-xs leading-relaxed text-stone">
                  eth_estimateGas with byte-identical calldata, both verifiers deployed on chain 46630. Solidity at 100 signatures exceeds the
                  32M per-transaction gas cap.{" "}
                  <a className="ink-link text-paper" href={`${GITHUB_URL}/blob/main/benchmarks/results/BENCHMARKS.md`} target="_blank" rel="noreferrer">
                    Methodology & raw data
                  </a>
                </p>
              </figure>
            ) : (
              <p className="font-display text-3xl">Benchmark in progress</p>
            )}
          </Reveal>
        </div>
      </Wrap>
    </div>
  );
}

function Bar({ label, value, max, tone }: { label: string; value: number | null; max: number; tone: "stone" | "red" }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 font-mono text-[0.65rem] uppercase tracking-wider text-stone">{label}</span>
      <div className="relative h-2.5 flex-1 bg-paper/10">
        {value ? (
          <div className={`h-full origin-left ${tone === "red" ? "bg-vermilion" : "bg-stone"}`} style={{ transform: `scaleX(${value / max})` }} />
        ) : (
          <div className="h-full w-full bg-[repeating-linear-gradient(45deg,rgba(184,176,162,.35)_0_6px,transparent_6px_12px)]" />
        )}
      </div>
      <span className="w-28 text-right font-mono text-xs tabular">{value ? fmt(value) : "exceeds cap"}</span>
    </div>
  );
}

// 06 -------------------------------------------------------------------------
const PLINTH: Record<string, { src: string; w: number; h: number }> = {
  NIKE: { src: "/art/plinth-podium.webp", w: 400, h: 146 },
  AAPL: { src: "/art/plinth-halo.webp", w: 510, h: 245 },
  SBUX: { src: "/art/plinth-sakura.webp", w: 600, h: 290 },
};

export function Ownership() {
  return (
    <Wrap id="ownership" label="Ownership" className="py-28 sm:py-40">
      <SectionHead n="06" eyebrow="Ownership" title={["Not points.", "Ownership."]} />
      <div className="mt-20 grid gap-16 sm:grid-cols-3 sm:gap-8">
        {BRANDS.map((b, i) => {
          const p = PLINTH[b.id];
          return (
            <Reveal key={b.id} delay={i * 0.12}>
              <article className="group relative flex flex-col items-center text-center">
                <BrandMark brand={b} className="h-12 w-20 text-ink transition-transform duration-700 ease-[var(--ease-ink)] group-hover:-translate-y-1.5" />
                <h3 className="mt-4 font-display text-4xl font-extrabold tracking-[0.06em]">{b.name}</h3>
                <div className="relative flex h-44 w-full items-end justify-center">
                  <div className="float w-full" style={{ ["--float-dur" as string]: `${8 + i}s` }}>
                    <Image src={p.src} alt="" width={p.w} height={p.h} sizes="(min-width: 640px) 30vw, 90vw" className="mx-auto h-auto max-h-44 w-auto edge-fade" />
                  </div>
                </div>
                <span className="mt-6 border border-vermilion/50 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-vermilion-deep">Demo asset</span>
                <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-muted">{b.category}</p>
                <div className="mt-5 flex w-full max-w-[16rem] justify-between border-t border-ink/15 pt-4 font-mono text-xs">
                  <span className="text-left">
                    {b.share}
                    <span className="block text-muted">vault share</span>
                  </span>
                  <span className="text-right">
                    {b.asset}
                    <span className="block text-muted">underlying</span>
                  </span>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
      <Reveal className="mx-auto mt-16 max-w-2xl text-center text-sm leading-relaxed text-muted">
        <p>
          Each brand has its own ERC-4626 vault. Rewards are deposited on your behalf, so you hold vault shares, not scattered dust. On
          testnet the underlying assets are fictional demo tokens. They are not securities and are not issued by or affiliated with these
          brands.
        </p>
      </Reveal>
    </Wrap>
  );
}

// 07 -------------------------------------------------------------------------
export function PortfolioPreview() {
  return (
    <div className="border-y border-ink/10 bg-paper-dark/40">
      <Wrap label="Portfolio preview" className="py-28 sm:py-36">
        <div className="grid items-center gap-16 lg:grid-cols-[1fr_1.1fr]">
          <SectionHead n="07" eyebrow="A statement, not a dashboard" title={["Brands you", "actually own."]} />
          <Reveal delay={0.1}>
            <LivePortfolioPreview />
          </Reveal>
        </div>
      </Wrap>
    </div>
  );
}

// 08 -------------------------------------------------------------------------
export function Security() {
  const items = [
    ["Replay protection", "A nullifier per receipt. The same purchase can't be claimed twice, by anyone."],
    ["Reward caps", "Per claim, per wallet per day and per brand per day, enforced by the contract."],
    ["Eligibility policies", "Brand, currency, amount range and purchase age are checked on-chain."],
    ["Attestation verification", "Only allowlisted attesters' signatures over the exact claim are accepted."],
    ["ERC-4626 accounting", "Admin-less vaults. Nobody but the holder can move your shares."],
    ["Testnet safeguards", "Demo assets refuse to deploy on production chains."],
  ];
  return (
    <Wrap label="Security" className="py-28 sm:py-40">
      <SectionHead n="08" eyebrow="Security" title={["Evidence, verification", "and ownership, separated."]} />
      <ul className="mt-16 grid gap-px bg-ink/10 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([t, d], i) => (
          <Reveal as="li" key={t} delay={(i % 3) * 0.08} className="bg-paper p-7">
            <span className="grid h-7 w-7 place-items-center rounded-full border border-vermilion text-sm text-vermilion" aria-hidden="true">
              ✓
            </span>
            <h3 className="mt-5 font-display text-xl font-bold">{t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-charcoal">{d}</p>
          </Reveal>
        ))}
      </ul>
      <Reveal className="mt-10 max-w-2xl text-sm text-muted">
        <p>
          STOCKBACK does not claim complete fraud prevention. Nullifiers stop receipt replay, not people with many wallets. Caps and budgets
          bound what anyone can earn, and the demo attester trusts the receipt details it is shown.{" "}
          <a className="ink-link text-ink" href={`${GITHUB_URL}/blob/main/SECURITY.md`} target="_blank" rel="noreferrer">
            Read the security model
          </a>
        </p>
      </Reveal>
    </Wrap>
  );
}

// 09 -------------------------------------------------------------------------
export function FinalCta() {
  return (
    <section aria-label="Get started" className="relative isolate overflow-hidden">
      <Image
        src="/art/ink-blossom.webp"
        alt=""
        width={740}
        height={323}
        sizes="100vw"
        className="absolute inset-x-0 bottom-0 -z-20 h-72 w-full object-cover opacity-45 mix-blend-multiply [mask-image:linear-gradient(to_bottom,transparent,black_55%)]"
      />
      <Reveal className="absolute bottom-10 left-[3%] -z-10 hidden w-[250px] xl:block" y={40}>
        <Image src="/art/torii.webp" alt="" width={450} height={380} sizes="250px" className="float h-auto w-full" />
      </Reveal>
      <Reveal className="absolute bottom-16 right-[4%] -z-10 hidden w-[210px] xl:block" y={40} delay={0.2}>
        <Image src="/art/plinth-disc.webp" alt="" width={450} height={455} sizes="210px" className="float h-auto w-full" style={{ ["--float-dur" as string]: "10s" }} />
      </Reveal>
      <div className="mx-auto max-w-[900px] px-5 pb-64 pt-36 text-center sm:px-8">
        <h2 className="font-display text-[clamp(2.6rem,6vw,5.2rem)] font-extrabold leading-[0.98]">
          <RevealLines lines={["Your next receipt", "could be your next", <span key="own">ownership<span className="text-vermilion">.</span></span>]} />
        </h2>
        <Reveal delay={0.3} className="mt-12 flex flex-wrap justify-center gap-4">
          <ButtonLink href="/app/dashboard">
            Start Stockback <Arrow />
          </ButtonLink>
          <ButtonLink href="/about" variant="ghost" className="bg-paper/70">
            Read the protocol
          </ButtonLink>
        </Reveal>
      </div>
    </section>
  );
}

/** Full-width ink-blossom band used between sections. */
export function InkBand() {
  return (
    <div aria-hidden="true" className="relative h-40 overflow-hidden sm:h-56">
      <Image
        src="/art/ink-blossom.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center opacity-55 mix-blend-multiply [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)]"
      />
    </div>
  );
}

export { Eyebrow };
