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

const CAP = 32_000_000; // Robinhood testnet maxTxGasLimit (ArbGasInfo), read on-chain
const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M` : `${Math.round(n / 1e3)}k`);

export async function StylusSection() {
  const bench = await getOnchainBenchmark();
  const best = bench?.rows.reduce((m, r) => (r.solidity && r.stylus ? Math.max(m, r.solidity / r.stylus) : m), 0) ?? 0;
  const top = CAP * 1.18;
  return (
    <div className="bg-ink text-paper">
      <Wrap label="Why Stylus" className="py-28 sm:py-36">
        <div className="grid items-end gap-16 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Reveal>
              <p className="flex items-center gap-4 font-mono text-[0.7rem] uppercase tracking-[0.24em] text-stone">
                <span className="text-vermilion">05</span>
                <span className="h-px w-10 bg-paper/30" />
                Why Stylus
              </p>
            </Reveal>
            <h2 className="mt-6 font-display text-[clamp(2.3rem,4.6vw,4rem)] font-bold leading-[1.02]">
              <RevealLines lines={["Verified in Rust."]} />
            </h2>
            {bench ? (
              <Reveal delay={0.2} className="mt-10">
                <p className="font-display text-[clamp(5rem,12vw,9rem)] font-extrabold leading-none tabular">
                  {best.toFixed(1)}
                  <span className="text-vermilion">×</span>
                </p>
                <p className="mt-3 max-w-xs text-paper/75">less gas than Solidity to verify Ed25519 signatures.</p>
              </Reveal>
            ) : (
              <p className="mt-10 font-display text-3xl">Benchmark in progress</p>
            )}
          </div>

          {bench && (
            <Reveal delay={0.15}>
              <figure aria-label="Gas used to verify 1, 10, 50 and 100 signatures, Solidity versus Stylus">
                <div className="relative h-[300px] border-b border-paper/20">
                  {/* per-transaction gas cap */}
                  <div className="absolute inset-x-0 border-t border-dashed border-paper/35" style={{ bottom: `${(CAP / top) * 100}%` }}>
                    <span className="absolute -top-5 left-0 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-stone">32M tx limit</span>
                  </div>
                  <div className="absolute inset-0 grid grid-cols-4 items-end gap-4 px-2 sm:gap-8 sm:px-6">
                    {bench.rows.map((r) => (
                      <div key={r.batch} className="flex h-full items-end justify-center gap-1.5 sm:gap-2.5">
                        <Column value={r.solidity} top={top} tone="stone" label={`Solidity, ${r.batch} signatures`} />
                        <Column value={r.stylus} top={top} tone="red" label={`Stylus, ${r.batch} signatures`} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-4 px-2 text-center font-mono text-xs text-stone sm:gap-8 sm:px-6">
                  {bench.rows.map((r) => (
                    <span key={r.batch}>{r.batch}</span>
                  ))}
                </div>
                <figcaption className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-stone">
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 bg-stone" />Solidity</span>
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 bg-vermilion" />Stylus</span>
                  <span className="normal-case tracking-normal">signatures per tx · Robinhood testnet ·{" "}
                    <a className="ink-link text-paper" href={`${GITHUB_URL}/blob/main/benchmarks/results/BENCHMARKS.md`} target="_blank" rel="noreferrer">data</a>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          )}
        </div>
      </Wrap>
    </div>
  );
}

/** One gas column. Null = did not fit in a transaction: drawn hatched, breaking through the cap line. */
function Column({ value, top, tone, label }: { value: number | null; top: number; tone: "stone" | "red"; label: string }) {
  const h = value ? Math.max((value / top) * 100, 1.2) : 100;
  return (
    <div className="group relative flex h-full w-5 items-end sm:w-8" title={`${label}: ${value ? fmt(value) + " gas" : "exceeds the 32M tx limit"}`}>
      <div
        className={`w-full origin-bottom transition-transform duration-500 group-hover:scale-x-110 ${
          !value
            ? "bg-[repeating-linear-gradient(45deg,rgba(184,176,162,.55)_0_5px,transparent_5px_10px)]"
            : tone === "red"
              ? "bg-vermilion"
              : "bg-stone"
        }`}
        style={{ height: `${h}%` }}
      />
      <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[0.6rem] text-paper opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {value ? compact(value) : "✕"}
      </span>
    </div>
  );
}

// 06 -------------------------------------------------------------------------
export function Ownership() {
  return (
    <Wrap id="ownership" label="Ownership" className="py-28 sm:py-40">
      <SectionHead n="06" eyebrow="Ownership" title={["Not points.", "Ownership."]} />
      <div className="mt-20 grid gap-14 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-ink/15">
        {BRANDS.map((b, i) => (
          <Reveal key={b.id} delay={i * 0.12}>
            <article className="group flex flex-col items-center px-6 text-center">
              <BrandMark brand={b} className="h-16 w-24 text-ink transition-transform duration-700 ease-[var(--ease-ink)] group-hover:-translate-y-1.5" />
              <h3 className="mt-7 font-display text-4xl font-extrabold tracking-[0.06em]">{b.name}</h3>
              <p className="mt-3 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
                {b.category} · <span className="text-vermilion-deep">Demo asset</span>
              </p>
              <p className="mt-5 font-mono text-xs text-charcoal">
                {b.share} <span className="text-muted">vault share</span> · {b.asset} <span className="text-muted">underlying</span>
              </p>
            </article>
          </Reveal>
        ))}
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
      <div className="mx-auto max-w-[900px] px-5 pb-10 pt-28 text-center sm:px-8 sm:pt-32">
        <h2 className="font-display text-[clamp(2.4rem,5vw,4.4rem)] font-extrabold leading-[1]">
          <RevealLines lines={["Your next receipt", "could be your next", <span key="own">ownership<span className="text-vermilion">.</span></span>]} />
        </h2>
        <Reveal delay={0.3} className="mt-10 flex flex-wrap justify-center gap-4">
          <ButtonLink href="/app/dashboard">
            Start Stockback <Arrow />
          </ButtonLink>
          <ButtonLink href="/about" variant="ghost">
            Read the protocol
          </ButtonLink>
        </Reveal>
      </div>
      {/* Ink-and-blossom stream, kept quiet: it frames the statement instead of competing with it. */}
      <Reveal y={30} delay={0.2}>
        <Image
          src="/art/blossom-stream.webp"
          alt=""
          width={1600}
          height={534}
          sizes="(min-width: 1200px) 1100px, 100vw"
          className="mx-auto -mt-6 h-auto w-full max-w-[1100px] opacity-60 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
        />
      </Reveal>
    </section>
  );
}

export { Eyebrow };
