import "server-only";
import { isAddress, getAddress } from "viem";
import { attestECDSA, attestEd25519, buildClaim, claimDigest, claimId } from "@/lib/attester-core.mjs";
import { brandById } from "@/lib/brands";
import { robinhoodTestnet } from "@/lib/chain";
import { contracts } from "@/lib/contracts";
import { getActiveVerifier } from "@/lib/stockback";

// DEMO ATTESTER. It signs the receipt details the user confirmed; it does not contact a merchant or
// payment network. Rewards are still bounded on-chain by per-claim / daily caps and the sponsor budget.

const SEED = process.env.ATTESTER_ED25519_SEED;
const ECDSA_KEY = process.env.ATTESTER_ECDSA_KEY as `0x${string}` | undefined;
const SALT = process.env.ATTESTER_SALT;

// ponytail: in-memory per-IP limiter, resets per server instance; use a shared store (e.g. Redis) if hosted at scale.
const hits = new Map<string, number[]>();
const LIMIT = 20;
const WINDOW_MS = 10 * 60_000;
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMIT;
}

// Active verifier is read from chain so the scheme always matches what the registry will check.
let verifierCache: { kind: string; at: number } | undefined;
async function activeScheme(): Promise<"ed25519" | "ecdsa"> {
  if (!verifierCache || Date.now() - verifierCache.at > 60_000) {
    verifierCache = { kind: (await getActiveVerifier()).kind, at: Date.now() };
  }
  if (verifierCache.kind === "stylus") return "ed25519";
  if (verifierCache.kind === "ecdsa") return "ecdsa";
  throw new Error("Registry verifier is not a known STOCKBACK verifier");
}

const bad = (error: string, status = 400) => Response.json({ error }, { status });

export async function POST(req: Request) {
  if (!SALT || (!SEED && !ECDSA_KEY)) return bad("Attester is not configured", 503);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return bad("Too many requests. Try again in a few minutes.", 429);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON");
  }
  const { claimant, brand, merchant, receiptRef, amount, currency, date } = body as Record<string, string>;

  if (typeof claimant !== "string" || !isAddress(claimant)) return bad("A valid wallet address is required");
  const b = typeof brand === "string" ? brandById(brand) : undefined;
  if (!b) return bad("STOCKBACK doesn't support this brand yet.", 422);
  if (typeof merchant !== "string" || !merchant.trim() || merchant.length > 80) return bad("Merchant name is required (max 80 characters)");
  if (typeof receiptRef !== "string" || !/^[A-Za-z0-9#/_.:-]{3,64}$/.test(receiptRef.trim()))
    return bad("Receipt ID must be 3-64 letters, numbers or - _ . / # :");
  if (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) return bad("Currency must be a 3-letter code like INR");
  if (typeof amount !== "string" || !/^\d{1,10}(\.\d{1,2})?$/.test(amount)) return bad("Amount must be a number with up to 2 decimals");
  const [rupees, paise = ""] = amount.split(".");
  const amountMinor = BigInt(rupees) * 100n + BigInt(paise.padEnd(2, "0"));
  if (amountMinor === 0n) return bad("Amount must be greater than zero");
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)))
    return bad("Date must be YYYY-MM-DD");

  const now = Math.floor(Date.now() / 1000);
  // Noon UTC of the purchase date, never later than a minute ago (the contract rejects future purchases).
  const purchasedAt = Math.min(Math.floor(Date.parse(`${date}T12:00:00Z`) / 1000), now - 60);

  try {
    const scheme = await activeScheme();
    const claim = buildClaim(
      {
        claimant: getAddress(claimant),
        brand: b.id,
        merchant: merchant.trim(),
        receiptRef: receiptRef.trim(),
        amount: amountMinor,
        currency,
        purchasedAt,
      },
      SALT,
      now,
    );
    const digest = claimDigest(claim, robinhoodTestnet.id, contracts.registry);
    const attestation =
      scheme === "ed25519" ? (SEED ? attestEd25519(SEED, digest) : null) : ECDSA_KEY ? await attestECDSA(ECDSA_KEY, digest) : null;
    if (!attestation) return bad(`Attester has no ${scheme} key configured`, 503);

    return Response.json({
      claim: Object.fromEntries(Object.entries(claim).map(([k, v]) => [k, typeof v === "bigint" ? v.toString() : v])),
      claimId: claimId(claim),
      attestation,
      scheme,
      demo: true,
    });
  } catch (e) {
    console.error("attest failed", e);
    return bad("Attestation failed. Please try again.", 500);
  }
}
