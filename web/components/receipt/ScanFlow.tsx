"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { decodeEventLog, type Hex } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import { Stamp } from "@/components/art/Art";
import { useVerifier } from "@/components/hooks/useStockback";
import { VerificationPipeline } from "@/components/protocol/VerificationPipeline";
import { Arrow, Button, ButtonLink, Eyebrow } from "@/components/ui/Button";
import { BRANDS, brandById } from "@/lib/brands";
import { FAUCET_URL } from "@/lib/chain";
import { receiptCommitmentRegistryAbi } from "@/lib/contracts";
import { readReceipt } from "@/lib/ocr";
import {
  CLAIM_STATUS,
  classifyClaimError,
  getClaimStatus,
  getTransactionUrl,
  inr,
  prepareClaim,
  publicClient,
  submitClaimRequest,
  units,
  type AttestedClaim,
  type ClaimError,
  type ReceiptInput,
} from "@/lib/stockback";
import { ReceiptCard } from "./ReceiptCard";

type Stage =
  | { s: "choose" }
  | { s: "reading"; progress: number; preview?: string }
  | { s: "review"; demo: boolean; preview?: string; note?: string }
  | { s: "working"; label: string }
  | { s: "preview"; claim: AttestedClaim; status: number; reward: bigint }
  | { s: "signing"; claim: AttestedClaim; reward: bigint }
  | { s: "confirming"; claim: AttestedClaim; reward: bigint; hash: Hex }
  | { s: "done"; claim: AttestedClaim; assets: bigint; hash: Hex }
  | { s: "error"; error: ClaimError; claim?: AttestedClaim; reward?: bigint };

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const rand4 = () => Math.random().toString(36).slice(2, 6).toUpperCase();

export function ScanFlow() {
  const { address } = useAccount();
  const { data: verifier } = useVerifier();
  const { writeContractAsync } = useWriteContract();
  const qc = useQueryClient();
  const [stage, setStage] = useState<Stage>({ s: "choose" });
  const [form, setForm] = useState<ReceiptInput>({ brand: "NIKE", merchant: "", receiptRef: "", amount: "", currency: "INR", date: today() });
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const brand = brandById(form.brand)!;
  const vkind = verifier?.kind ?? "unknown";

  function loadDemo() {
    setForm({
      brand: "NIKE",
      merchant: "Nike Store 042, Mumbai",
      // Receipt IDs are single-use (nullifier), so every demo run gets a fresh one.
      receiptRef: `DEMO-NIKE-${address?.slice(2, 6).toUpperCase() ?? "0000"}-${rand4()}`,
      amount: "2000",
      currency: "INR",
      date: today(),
    });
    setStage({ s: "review", demo: true });
  }

  async function onFile(file?: File) {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setStage({ s: "reading", progress: 0, preview });
    try {
      const { fields } = await readReceipt(file, (p) => setStage({ s: "reading", progress: p, preview }));
      setForm((f) => ({
        brand: fields.brand ?? f.brand,
        merchant: fields.merchant ?? (fields.brand ? brandById(fields.brand)?.merchant ?? "" : ""),
        receiptRef: fields.receiptRef ?? "",
        amount: fields.amount ?? "",
        currency: "INR",
        date: fields.date ?? today(),
      }));
      const missing = [!fields.brand && "brand", !fields.amount && "amount", !fields.receiptRef && "receipt ID", !fields.date && "date"].filter(Boolean);
      setStage({
        s: "review",
        demo: false,
        preview,
        note: missing.length ? `We couldn't read the ${missing.join(", ")}. Please fill ${missing.length > 1 ? "them" : "it"} in.` : "Check the details we read.",
      });
    } catch {
      setStage({ s: "review", demo: false, preview, note: "We couldn't read this image. Enter the details manually." });
    }
  }

  async function prove() {
    if (!address) return;
    try {
      setStage({ s: "working", label: "Creating purchase proof…" });
      const claim = await prepareClaim(address, form);
      setStage({ s: "working", label: "Checking eligibility…" });
      const { status, reward } = await getClaimStatus(claim);
      setStage({ s: "preview", claim, status, reward });
    } catch (e) {
      setStage({ s: "error", error: { kind: "other", detail: e instanceof Error ? e.message : String(e) } });
    }
  }

  async function claimOwnership(claim: AttestedClaim, reward: bigint) {
    if (!address) return;
    const req = submitClaimRequest(claim);
    try {
      // Pre-flight: surfaces rejections and missing gas money before the wallet opens.
      const [gas, gasPrice, balance] = await Promise.all([
        publicClient.estimateContractGas({ ...req, account: address }),
        publicClient.getGasPrice(),
        publicClient.getBalance({ address }),
      ]);
      if (balance < (gas * gasPrice * 12n) / 10n) return setStage({ s: "error", error: { kind: "funds" }, claim, reward });

      setStage({ s: "signing", claim, reward });
      const hash = await writeContractAsync(req);
      setStage({ s: "confirming", claim, reward, hash });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") return setStage({ s: "error", error: { kind: "other", detail: `Transaction reverted: ${hash}` }, claim, reward });

      let assets = reward;
      for (const log of receipt.logs) {
        try {
          const ev = decodeEventLog({ abi: receiptCommitmentRegistryAbi, data: log.data, topics: log.topics });
          if (ev.eventName === "RewardAllocated") assets = ev.args.assets;
        } catch {}
      }
      // Refetch (including inactive, cached pages) before showing success, so no screen shows pre-claim data.
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["portfolio"], refetchType: "all" }),
        qc.invalidateQueries({ queryKey: ["activity"], refetchType: "all" }),
      ]).catch(() => {});
      setStage({ s: "done", claim, assets, hash });
    } catch (e) {
      setStage({ s: "error", error: classifyClaimError(e), claim, reward });
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Scan · Prove · Own</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Scan receipt</h1>
        </div>
        <span className="border border-ink/20 px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted">Demo attestation</span>
      </header>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => onFile(e.target.files?.[0])} />
      <input ref={uploadRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => onFile(e.target.files?.[0])} />

      <AnimatePresence mode="wait">
        <motion.div
          key={stage.s}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10"
        >
          {stage.s === "choose" && (
            <div className="grid gap-px bg-ink/10 sm:grid-cols-3">
              <Choice title="Camera" body="Photograph a paper receipt." onClick={() => cameraRef.current?.click()} icon="M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
              <Choice title="Upload" body="Choose a receipt image." onClick={() => uploadRef.current?.click()} icon="M12 16V4M7 9l5-5 5 5M4 20h16" />
              <Choice title="Use demo receipt" body="Nike · ₹2,000 · a fresh receipt ID." onClick={loadDemo} icon="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" accent />
            </div>
          )}

          {stage.s === "reading" && (
            <Split visual={stage.preview ? <ImagePreview src={stage.preview} scanning /> : null}>
              <Working label="Reading receipt…" sub={`${Math.round(stage.progress * 100)}% · on your device`} />
            </Split>
          )}

          {stage.s === "review" && (
            <Split visual={stage.preview ? <ImagePreview src={stage.preview} /> : <ReceiptCard r={form} demo={stage.demo} className="float" />}>
              <p className="text-sm text-charcoal">{stage.note ?? "A demo purchase, attested by the STOCKBACK demo attester and claimed for real on Robinhood testnet."}</p>
              <ReceiptForm form={form} setForm={setForm} />
              <div className="mt-8 flex flex-wrap gap-3">
                <Button onClick={prove} disabled={!form.amount || !form.receiptRef || !form.merchant}>
                  Verify purchase <Arrow />
                </Button>
                <Button variant="ghost" onClick={() => setStage({ s: "choose" })}>
                  Back
                </Button>
              </div>
            </Split>
          )}

          {stage.s === "working" && (
            <Split visual={<ReceiptCard r={form} className="float" />}>
              <Working label={stage.label} />
            </Split>
          )}

          {stage.s === "preview" && (
            <Split visual={<ReceiptCard r={form} />}>
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-muted">Claim preview</p>
              <ul className="mt-5 space-y-3">
                <Check ok={stage.status !== 5} label="Attested" note={stage.claim.scheme === "ed25519" ? "Ed25519 · demo attester" : "ECDSA · demo attester"} />
                <Check ok={stage.status !== 4} label="New receipt" note="Never claimed before" />
                {stage.status === 4 || stage.status === 5 ? (
                  <Check label="Eligible" note="Not evaluated: an earlier check failed" />
                ) : (
                  <Check ok={stage.status === 0} label="Eligible" note={stage.status === 0 ? "Brand, amount and date accepted" : CLAIM_STATUS[stage.status]?.body} />
                )}
              </ul>
              {stage.status === 0 ? (
                <>
                  <div className="mt-8 border-t border-ink/15 pt-6">
                    <p className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-muted">Ownership reward</p>
                    <p className="mt-2 font-display text-5xl font-bold tabular">{inr(units(stage.reward))}</p>
                    <p className="mt-1 font-mono text-xs text-muted">
                      {units(stage.reward).toLocaleString("en-IN", { maximumFractionDigits: 4 })} {brand.asset} → {brand.name} vault ({brand.share}) · demo units
                    </p>
                  </div>
                  <Button className="mt-8" onClick={() => claimOwnership(stage.claim, stage.reward)}>
                    Claim ownership <Arrow />
                  </Button>
                </>
              ) : (
                <StatusProblem status={stage.status} onEdit={() => setStage({ s: "review", demo: false })} />
              )}
            </Split>
          )}

          {(stage.s === "signing" || stage.s === "confirming") && (
            <div>
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-muted">
                {stage.s === "signing" ? "Wallet signature" : "Verifying on Robinhood testnet"}
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold">
                {stage.s === "signing" ? "Approve “Create ownership” in your wallet." : vkind === "stylus" ? "Verifying with Stylus…" : "Verifying purchase…"}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {stage.s === "signing"
                  ? `One transaction on Robinhood Chain testnet. Reward ${inr(units(stage.reward))} in ${brand.asset}.`
                  : "Commitment, nullifier, signature, eligibility, reward and vault deposit all run inside this one transaction."}
              </p>
              <div className="mt-8">
                <VerificationPipeline phase={stage.s === "signing" ? "waiting" : "running"} verifier={vkind} />
              </div>
              {stage.s === "confirming" && (
                <a className="ink-link mt-6 inline-block font-mono text-xs" href={getTransactionUrl(stage.hash)} target="_blank" rel="noreferrer">
                  {stage.hash.slice(0, 10)}…{stage.hash.slice(-6)} · view on explorer
                </a>
              )}
            </div>
          )}

          {stage.s === "done" && <Done brandName={brand.name} asset={brand.asset} assets={stage.assets} hash={stage.hash} vkind={vkind} onAgain={() => setStage({ s: "choose" })} />}

          {stage.s === "error" && (
            <ErrorPanel
              error={stage.error}
              onRetry={() => (stage.claim ? claimOwnership(stage.claim, stage.reward ?? 0n) : setStage({ s: "review", demo: false }))}
              onEdit={() => setStage({ s: "review", demo: false })}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ------------------------------------------------------------------ pieces

function Choice({ title, body, onClick, icon, accent }: { title: string; body: string; onClick: () => void; icon: string; accent?: boolean }) {
  return (
    <button type="button" onClick={onClick} className="group flex min-h-32 flex-row items-center gap-6 bg-paper p-6 text-left sm:min-h-56 sm:flex-col sm:items-start sm:justify-between sm:gap-0 sm:p-7 transition-colors duration-300 hover:bg-[#FBF8F1]">
      <svg viewBox="0 0 24 24" className={`h-8 w-8 ${accent ? "text-vermilion" : "text-ink"}`} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
        <path d={icon} />
      </svg>
      <span>
        <span className="block font-display text-2xl font-bold">{title}</span>
        <span className="mt-2 block text-sm text-muted">{body}</span>
        <span className="mt-5 block h-px w-10 bg-ink transition-all duration-500 group-hover:w-20 group-hover:bg-vermilion" aria-hidden="true" />
      </span>
    </button>
  );
}

function Split({ visual, children }: { visual: ReactNode; children: ReactNode }) {
  return (
    <div className="grid items-start gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-14">
      <div className="mx-auto w-full max-w-sm">{visual}</div>
      <div>{children}</div>
    </div>
  );
}

function ImagePreview({ src, scanning }: { src: string; scanning?: boolean }) {
  return (
    <div className="relative overflow-hidden border border-ink/15 bg-paper-dark">
      {/* eslint-disable-next-line @next/next/no-img-element -- local object URL of the user's photo */}
      <img src={src} alt="Your receipt" className="max-h-[60vh] w-full object-contain" />
      {scanning && (
        <>
          <div className="scan-line absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-transparent via-vermilion/25 to-transparent" style={{ ["--scan-h" as string]: "55vh" }} />
          <div className="scan-line absolute inset-x-0 top-6 h-px bg-vermilion" style={{ ["--scan-h" as string]: "55vh" }} />
        </>
      )}
    </div>
  );
}

function Working({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="py-8" role="status" aria-live="polite">
      <div className="relative h-px w-full overflow-hidden bg-ink/10">
        <motion.div className="absolute inset-y-0 w-1/3 bg-vermilion" animate={{ x: ["-100%", "300%"] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} />
      </div>
      <p className="mt-6 font-display text-3xl font-bold">{label}</p>
      {sub && <p className="mt-2 font-mono text-xs text-muted">{sub}</p>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted">{label}</span>
      {children}
    </label>
  );
}
const input = "mt-1.5 w-full border-b border-ink/30 bg-transparent py-2 text-base outline-none transition-colors focus:border-vermilion";

function ReceiptForm({ form, setForm }: { form: ReceiptInput; setForm: (f: ReceiptInput) => void }) {
  const set = (k: keyof ReceiptInput) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2">
      <Field label="Brand">
        <select className={input} value={form.brand} onChange={set("brand")}>
          {BRANDS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} (demo vault)
            </option>
          ))}
        </select>
      </Field>
      <Field label="Amount (₹)">
        <input className={`${input} tabular`} inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/[^\d.]/g, "") })} placeholder="2000" />
      </Field>
      <Field label="Merchant">
        <input className={input} value={form.merchant} onChange={set("merchant")} placeholder="Nike Store, Mumbai" maxLength={80} />
      </Field>
      <Field label="Receipt ID">
        <input className={`${input} font-mono text-sm`} value={form.receiptRef} onChange={set("receiptRef")} placeholder="INV-00123" maxLength={64} />
      </Field>
      <Field label="Currency">
        <select className={input} value={form.currency} onChange={set("currency")}>
          <option value="INR">INR</option>
        </select>
      </Field>
      <Field label="Date">
        <input className={input} type="date" value={form.date} max={new Date().toISOString().slice(0, 10)} onChange={set("date")} />
      </Field>
    </div>
  );
}

/** ok: true passed, false failed, undefined not evaluated. */
function Check({ ok, label, note }: { ok?: boolean; label: string; note?: string }) {
  const tone = ok === undefined ? "border border-ink/25 text-muted" : ok ? "bg-ink text-paper" : "border border-vermilion text-vermilion";
  return (
    <li className="flex items-start gap-4">
      <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs ${tone}`} aria-hidden="true">
        {ok === undefined ? "–" : ok ? "✓" : "×"}
      </span>
      <span>
        <span className="block font-semibold">
          {label}
          <span className="sr-only">{ok === undefined ? ": not evaluated" : ok ? ": passed" : ": failed"}</span>
        </span>
        {note && <span className="block text-sm text-muted">{note}</span>}
      </span>
    </li>
  );
}

function StatusProblem({ status, onEdit }: { status: number; onEdit: () => void }) {
  const s = CLAIM_STATUS[status];
  return (
    <div className="mt-8 border-l-2 border-vermilion pl-5">
      <p className="font-display text-2xl font-bold">{s?.title ?? "Not eligible"}</p>
      <p className="mt-1 text-charcoal">{s?.body}</p>
      <Button variant="ghost" className="mt-6" onClick={onEdit}>
        Edit receipt
      </Button>
      <details className="mt-4 text-xs text-muted">
        <summary className="cursor-pointer">Technical details</summary>
        <p className="mt-2 font-mono">previewClaim → ClaimStatus.{s?.key ?? status}</p>
      </details>
    </div>
  );
}

function ErrorPanel({ error, onRetry, onEdit }: { error: ClaimError; onRetry: () => void; onEdit: () => void }) {
  const copy =
    error.kind === "funds"
      ? { t: "Your wallet needs testnet ETH to create ownership.", b: "Claims cost a tiny amount of Robinhood testnet ETH for gas." }
      : error.kind === "rejected"
        ? { t: "Ownership wasn't created.", b: "The request was declined in your wallet. Nothing was spent." }
        : error.kind === "status"
          ? { t: CLAIM_STATUS[error.status]?.title ?? "Not eligible", b: CLAIM_STATUS[error.status]?.body ?? "" }
          : { t: "Something interrupted the claim.", b: "Your purchase wasn't used. You can try again." };
  return (
    <div className="max-w-xl" role="alert">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-vermilion-deep">Not completed</p>
      <h2 className="mt-3 font-display text-4xl font-bold leading-tight">{copy.t}</h2>
      <p className="mt-3 text-charcoal">{copy.b}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        {error.kind === "funds" && (
          <ButtonLink href={FAUCET_URL} external>
            Get testnet ETH <Arrow />
          </ButtonLink>
        )}
        {error.kind === "status" || error.kind === "other" ? (
          <Button onClick={onEdit}>Edit receipt</Button>
        ) : (
          <Button variant={error.kind === "funds" ? "ghost" : "ink"} onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
      {(error.kind === "other" || error.kind === "status") && (
        <details className="mt-6 text-xs text-muted">
          <summary className="cursor-pointer">Technical details</summary>
          <p className="mt-2 break-all font-mono">{error.kind === "other" ? error.detail : `ClaimRejected(${CLAIM_STATUS[error.status]?.key})`}</p>
        </details>
      )}
    </div>
  );
}

function Done({ brandName, asset, assets, hash, vkind, onAgain }: { brandName: string; asset: string; assets: bigint; hash: Hex; vkind: string; onAgain: () => void }) {
  return (
    <div className="grid items-center gap-12 md:grid-cols-[1fr_1.1fr]">
      <div className="relative grid place-items-center py-10">
        <motion.div initial={{ scale: 2.2, opacity: 0, rotate: -30 }} animate={{ scale: 1, opacity: 1, rotate: -8 }} transition={{ duration: 0.45, ease: [0.3, 1.4, 0.5, 1] }}>
          <Stamp label="Ownership created" className="h-52 w-52 text-center text-lg" />
        </motion.div>
      </div>
      <div>
        <VerificationPipeline phase="done" verifier={vkind as "stylus"} />
        <p className="mt-10 font-mono text-[0.7rem] uppercase tracking-[0.24em] text-muted">{brandName} vault</p>
        <p className="mt-2 font-display text-6xl font-bold tabular">+{inr(units(assets))}</p>
        <p className="mt-1 font-mono text-xs text-muted">
          {units(assets).toLocaleString("en-IN", { maximumFractionDigits: 4 })} {asset} of demo exposure · confirmed on Robinhood testnet
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href={getTransactionUrl(hash)} external>
            View transaction <Arrow />
          </ButtonLink>
          <ButtonLink href="/app/portfolio" variant="ghost">
            View portfolio
          </ButtonLink>
        </div>
        <button type="button" onClick={onAgain} className="ink-link mt-6 text-sm">
          Scan another receipt
        </button>
        <p className="mt-6 text-xs text-muted">
          Transaction <Link className="ink-link font-mono" href={getTransactionUrl(hash)} target="_blank">{hash.slice(0, 10)}…{hash.slice(-6)}</Link>
        </p>
      </div>
    </div>
  );
}
