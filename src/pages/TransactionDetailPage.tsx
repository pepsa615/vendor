import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileImage,
  FileText,
  ReceiptText,
  Share2,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { apiDownload, apiRequest } from "../api/client.ts";
import {
  Alert,
  Badge,
  Button,
  Card,
  Skeleton,
} from "../components/ui/index.ts";
import type { WalletTransaction } from "../features/account/types.ts";

const money = (value?: string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(Number(value ?? 0));

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function TransactionDetailPage() {
  const { transactionId = "" } = useParams();
  const transaction = useQuery({
    queryKey: ["wallet-transaction", transactionId],
    queryFn: () =>
      apiRequest<WalletTransaction>(
        `/account/wallet/transactions/${encodeURIComponent(transactionId)}`,
      ),
    enabled: Boolean(transactionId),
  });
  const receiptPath = `/account/wallet/transactions/${encodeURIComponent(transactionId)}/receipt`;

  async function download(format: "pdf" | "svg") {
    const blob = await apiDownload(`${receiptPath}.${format}`);
    save(blob, `pepsa-receipt-${transactionId}.${format}`);
  }

  async function share() {
    const blob = await apiDownload(`${receiptPath}.pdf`);
    const file = new File([blob], `pepsa-receipt-${transactionId}.pdf`, {
      type: "application/pdf",
    });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: "Pepsa transaction receipt",
        text: `Receipt for transaction ${transactionId}`,
        files: [file],
      });
      return;
    }
    save(blob, file.name);
  }

  if (transaction.isLoading)
    return <Skeleton className="h-[32rem] rounded-2xl" />;
  if (!transaction.data)
    return (
      <Alert tone="danger" title="Transaction unavailable">
        This transaction could not be found in your Vendor wallet.
      </Alert>
    );

  const item = transaction.data;
  const total =
    Number(item.amount) +
    Number(item.charges ?? 0) +
    Number(item.stamp_duty ?? 0);
  const recipient = item.destination
    ? [
        item.destination.account_name,
        item.destination.account_number,
        item.destination.bank_name,
      ]
        .filter(Boolean)
        .join(" · ")
    : item.counterparty_account_number || "Not applicable";
  const successful = item.status === "successful";

  return (
    <section className="mx-auto max-w-5xl">
      <Link
        to="/account?view=wallet"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-brand"
      >
        <ArrowLeft className="size-4" />
        Back to wallet
      </Link>
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand">Wallet transaction</p>
          <h1 className="mt-1 text-2xl font-bold">Transaction details</h1>
          <p className="mt-1 font-mono text-xs text-muted">
            {item.transaction_id}
          </p>
        </div>
        <Badge tone={successful ? "success" : "warning"} size="lg" dot>
          {item.status.replaceAll("_", " ")}
        </Badge>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Card className="overflow-hidden p-0">
            <div className="bg-gradient-to-br from-brand-700 to-brand-900 p-7 text-white">
              <div className="flex items-center justify-between">
                <ReceiptText className="size-6" />
                {successful && (
                  <CheckCircle2 className="size-6 text-emerald-300" />
                )}
              </div>
              <p className="mt-8 text-sm text-white/70">
                Total transaction value
              </p>
              <p className="mt-2 text-4xl font-bold">
                {money(total.toFixed(2))}
              </p>
              <p className="mt-3 text-sm capitalize text-white/80">
                {item.direction} · {item.type.replaceAll("_", " ")}
              </p>
            </div>
            <div className="grid gap-x-8 gap-y-5 p-6 sm:grid-cols-2">
              <Detail label="Amount" value={money(item.amount)} />
              <Detail label="Charges" value={money(item.charges)} />
              <Detail label="Stamp duty" value={money(item.stamp_duty)} />
              <Detail label="Recipient / destination" value={recipient} />
              <Detail
                label="Narration"
                value={item.narration || "Not provided"}
              />
              <Detail
                label="Provider reference"
                value={item.provider_reference || "Not available"}
              />
              <Detail
                label="Created"
                value={new Date(item.created_at).toLocaleString("en-NG")}
              />
              <Detail
                label="Completed"
                value={
                  item.executed_at
                    ? new Date(item.executed_at).toLocaleString("en-NG")
                    : "Processing"
                }
              />
              <Detail
                label="Balance before"
                value={money(item.balance_before)}
              />
              <Detail label="Balance after" value={money(item.balance_after)} />
            </div>
          </Card>
        </div>

        <Card className="h-fit lg:sticky lg:top-6">
          <FileText className="size-6 text-brand" />
          <h2 className="mt-3 font-bold">Receipt</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Generated by the Pepsa server from the authoritative transaction
            record.
          </p>
          <div className="mt-5 grid gap-3">
            <Button onClick={() => void share()}>
              <Share2 className="size-4" /> Share receipt
            </Button>
            <Button variant="outline" onClick={() => void download("pdf")}>
              <Download className="size-4" /> Download PDF
            </Button>
            <Button variant="outline" onClick={() => void download("svg")}>
              <FileImage className="size-4" /> Download image
            </Button>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted">
            On supported phones, Share opens the native share sheet. Other
            devices download the PDF.
          </p>
        </Card>
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold">{value}</p>
    </div>
  );
}
