import { Check, Copy, ExternalLink, QrCode, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { PublicOrderLink } from "../../hooks/useVendorProfile.ts";
import { Alert, Button, Card, Modal } from "../ui/index.ts";

const blockerCopy: Record<string, string> = {
  VENDOR_NOT_APPROVED: "Your vendor account must be approved.",
  PRICING_NOT_CONFIGURED:
    "Configure customer-order pricing and all four tiers.",
  PAYMENT_NOT_READY: "Provision and activate your Pepsa Payment account.",
};

export function PublicOrderLinkCard({
  publicOrder,
  compact = false,
}: {
  publicOrder: PublicOrderLink;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const url = useMemo(
    () => new URL(publicOrder.path, window.location.origin).toString(),
    [publicOrder.path],
  );
  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2_000);
  };
  const share = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Place an order",
        text: "Place a delivery order with us on Pepsa.",
        url,
      });
      return;
    }
    await copy();
  };
  const disabled = !publicOrder.enabled;
  return (
    <Card className={compact ? "p-4" : "p-5"}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
            Receive customer orders
          </p>
          <h2 className="mt-1 text-lg font-semibold">Share your order link</h2>
          <p className="mt-1 text-sm text-muted">
            Customers can price, pay for, and submit deliveries from your
            branded public page.
          </p>
          <p className="mt-3 truncate rounded-lg bg-neutral-50 px-3 py-2 font-mono text-sm">
            {url}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={disabled} onClick={() => void copy()}>
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            {copied ? "Copied" : "Copy Link"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={disabled}
            onClick={() => void share()}
          >
            <Share2 className="size-4" /> Share
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={disabled}
            onClick={() => setQrOpen(true)}
          >
            <QrCode className="size-4" /> QR Code
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={disabled}
            onClick={() =>
              window.open(
                `https://wa.me/?text=${encodeURIComponent(`Place an order with us: ${url}`)}`,
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            WhatsApp
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={disabled}
            onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
          >
            <ExternalLink className="size-4" /> Preview
          </Button>
        </div>
      </div>
      {disabled && (
        <Alert className="mt-4" tone="warning" title="Order link unavailable">
          <ul className="list-disc space-y-1 pl-4">
            {publicOrder.blockers.map((blocker) => (
              <li key={blocker}>{blockerCopy[blocker] ?? blocker}</li>
            ))}
          </ul>
        </Alert>
      )}
      <Modal
        isOpen={qrOpen}
        onOpenChange={setQrOpen}
        title="Customer order QR code"
        description="Customers can scan this code to open your public order page."
      >
        <div className="grid place-items-center gap-4 py-3 text-center">
          <div className="rounded-2xl border border-border bg-white p-5">
            <QRCodeSVG value={url} size={220} level="M" includeMargin />
          </div>
          <p className="max-w-sm break-all text-sm text-muted">{url}</p>
          <Button onClick={() => void copy()}>
            <Copy className="size-4" /> Copy Link
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
