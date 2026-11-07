import type { Bank } from "./types.ts";

/** Best-effort Nigerian bank logo CDN candidates by NIP/CBN code. */
export function bankLogoUrl(bank: Pick<Bank, "code" | "name">): string {
  const code = bank.code.replace(/\D/g, "");
  // Flutterwave-hosted logos are commonly keyed by bank code.
  return `https://assets.flutterwave.com/banks/logos/${code}.png`;
}

export function isPepsaRailBank(bank: Pick<Bank, "code" | "name">): boolean {
  return /9\s*(?:psb|payment\s+service\s+bank)|pepsa/i.test(bank.name);
}
