import Link from "next/link";
import { Seal } from "@/components/art/Art";
import { GITHUB_URL } from "@/lib/chain";

export function Footer() {
  return (
    <footer className="border-t border-ink/15 bg-paper-dark/40">
      <div className="mx-auto grid max-w-[1320px] gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <Seal size={34} />
            <span className="font-display text-xl font-bold tracking-[0.22em]">STOCKBACK</span>
          </div>
          <p className="mt-5 font-mono text-xs uppercase tracking-[0.3em] text-muted">Scan. Prove. Own.</p>
          <p className="mt-8 max-w-sm text-sm leading-relaxed text-charcoal">
            STOCKBACK is currently running with simulated assets on Robinhood Chain testnet. Brand names identify demo
            vaults only; they are not partners, and demo assets are not securities.
          </p>
        </div>
        <nav aria-label="Footer: product">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-muted">Product</p>
          <ul className="mt-5 space-y-3 text-sm">
            <li><Link className="ink-link" href="/how-it-works">How it works</Link></li>
            <li><Link className="ink-link" href="/supported-brands">Brands</Link></li>
            <li><Link className="ink-link" href="/about">About</Link></li>
            <li><Link className="ink-link" href="/app/dashboard">Open app</Link></li>
          </ul>
        </nav>
        <nav aria-label="Footer: protocol">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-muted">Protocol</p>
          <ul className="mt-5 space-y-3 text-sm">
            <li><a className="ink-link" href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub</a></li>
            <li><a className="ink-link" href={`${GITHUB_URL}/blob/main/SECURITY.md`} target="_blank" rel="noreferrer">Security</a></li>
            <li><a className="ink-link" href={`${GITHUB_URL}/blob/main/docs/ARCHITECTURE.md`} target="_blank" rel="noreferrer">Architecture</a></li>
            <li><span className="inline-flex items-center gap-2 text-muted"><span className="h-1.5 w-1.5 rounded-full bg-vermilion" />Robinhood Chain testnet</span></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
