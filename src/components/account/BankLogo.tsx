import { useState } from "react";
import { bankLogoUrl } from "../../features/account/bankLogo.ts";
import type { Bank } from "../../features/account/types.ts";

export function BankLogo({
  bank,
  size = 40,
  className = "",
}: {
  bank?: Pick<Bank, "code" | "name"> | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = bank ? bankLogoUrl(bank) : "";

  if (!bank || failed || !src) {
    return (
      <img
        src="/logo.png"
        alt=""
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover grayscale blur-[1.5px] opacity-55 ${className}`}
      />
    );
  }

  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-full bg-white object-contain ${className}`}
      onError={() => setFailed(true)}
    />
  );
}

export function PepsaRailLogo({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src="/logo.png"
      alt="Pepsa"
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-cover ${className}`}
    />
  );
}
