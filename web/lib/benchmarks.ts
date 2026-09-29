import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type BenchRow = { batch: number; solidity: number | null; stylus: number | null };

/** Parses benchmarks/results/onchain-46630.md (written by benchmarks/run_onchain.sh). Returns null if absent. */
export async function getOnchainBenchmark(): Promise<{ rows: BenchRow[]; meta: string } | null> {
  try {
    const md = await readFile(join(process.cwd(), "..", "benchmarks", "results", "onchain-46630.md"), "utf8");
    const rows = [...md.matchAll(/^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/gm)].map((m) => ({
      batch: Number(m[1]),
      solidity: /^\d+$/.test(m[2]) ? Number(m[2]) : null,
      stylus: /^\d+$/.test(m[3]) ? Number(m[3]) : null,
    }));
    return rows.length ? { rows, meta: md.split("\n")[0] } : null;
  } catch {
    return null;
  }
}
