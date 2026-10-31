import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseDate } from "@internationalized/date";
import {
  ArrowLeft,
  ArrowDownToLine,
  Banknote,
  Check,
  CheckCircle2,
  ChevronRight,
  Gauge,
  Lightbulb,
  LoaderCircle,
  Phone,
  ReceiptText,
  ShieldCheck,
  Send,
  Smartphone,
  Tv,
  Wifi,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiDownload, apiRequest } from "../api/client.ts";
import {
  Alert,
  Badge,
  Button,
  Card,
  DatePicker,
  FormField,
  Input,
  Modal,
  PinInput,
  SearchInput,
  Select,
  Skeleton,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "../components/ui/index.ts";
import { useSession } from "../contexts/SessionContext.tsx";
import type {
  AccountSummary,
  Bank,
  SettlementEntry,
  Statement,
  WalletSummary,
} from "../features/account/types.ts";

const ngn = (minor: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    minor / 100,
  );
const moneyString = (value?: string) =>
  value
    ? new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
      }).format(Number(value))
    : "—";
const idempotency = () => crypto.randomUUID();
const REPORT_FROM = new Date(Date.now() - 30 * 86_400_000)
  .toISOString()
  .slice(0, 10);
const REPORT_TO = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
export default function AccountPage() {
  const [params] = useSearchParams();
  const { hasPermission } = useSession();
  const canReadSettlement = hasPermission("settlement.read");
  const canReadWallet = hasPermission("wallet.read");
  const requested = params.get("view");
  const view =
    requested === "wallet" && canReadWallet
      ? "wallet"
      : requested === "settlement-ledger" && canReadSettlement
        ? "settlement-ledger"
        : canReadSettlement
          ? "settlement-ledger"
          : "wallet";
  if (!canReadSettlement && !canReadWallet)
    return (
      <Alert tone="danger" title="Account access required">
        Your role does not include settlement or wallet access.
      </Alert>
    );
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Account</h1>
          <p className="mt-1 text-sm text-muted">
            Earnings remain separate from your spendable Pepsa wallet.
          </p>
        </div>
      </div>
      {view === "wallet" ? <WalletView /> : <SettlementView />}
    </section>
  );
}
function useSummary() {
  return useQuery({
    queryKey: ["account-summary"],
    queryFn: () => apiRequest<AccountSummary>("/account/settlement-summary"),
  });
}
function useWallet() {
  return useQuery({
    queryKey: ["wallet-summary"],
    queryFn: () => apiRequest<WalletSummary>("/account/wallet"),
  });
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </Card>
  );
}
function SettlementView() {
  const [from, setFrom] = useState(REPORT_FROM);
  const [to, setTo] = useState(REPORT_TO);
  const summary = useSummary();
  const entries = useQuery({
    queryKey: ["settlements"],
    queryFn: () => apiRequest<SettlementEntry[]>("/account/settlements"),
  });
  const [cash, setCash] = useState(false);
  if (summary.isLoading)
    return (
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  if (summary.error)
    return (
      <Alert tone="danger" title="Account unavailable">
        We could not load settlement information.
      </Alert>
    );
  const s = summary.data!;
  const total = (entries.data ?? []).reduce(
    (x, e) => x + e.totalAmountMinor,
    0,
  );
  const earned = (entries.data ?? []).reduce((x, e) => x + e.earningsMinor, 0);
  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total revenue" value={ngn(total)} />
        <Stat label="Earnings" value={ngn(earned)} />
        <Stat
          label="Available to cash out"
          value={moneyString(s.settlement.settled_balance)}
        />
        <Stat
          label="Pending"
          value={moneyString(s.settlement.pending_balance)}
        />
      </div>
      {s.outstandingFeeMinor > 0 && (
        <Alert tone="warning" title="Outstanding dispatch fees">
          {ngn(s.outstandingFeeMinor)} will be collected from your next wallet
          inflow.
        </Alert>
      )}
      <div className="flex flex-wrap items-end justify-end gap-2">
        <DatePicker
          label="From"
          value={parseDate(from)}
          onChange={(value) => value && setFrom(value.toString())}
        />
        <DatePicker
          label="To"
          value={parseDate(to)}
          onChange={(value) => value && setTo(value.toString())}
        />
        <Button
          variant="outline"
          onClick={() => void downloadSettlement(from, to)}
        >
          Export CSV
        </Button>
        <Button onClick={() => setCash(true)}>
          <ArrowDownToLine className="size-4" /> Cash Out
        </Button>
      </div>
      <Card>
        <h2 className="mb-4 font-semibold">Order history</h2>
        <Table>
          <THead>
            <Tr>
              <Th>Reference</Th>
              <Th>Date</Th>
              <Th>Type</Th>
              <Th>Counterparty</Th>
              <Th>Total</Th>
              <Th>Earnings</Th>
              <Th>Status</Th>
            </Tr>
          </THead>
          <TBody>
            {(entries.data ?? []).map((e) => (
              <Tr key={e.id}>
                <Td>{e.sourceReference}</Td>
                <Td>{new Date(e.createdAt).toLocaleDateString()}</Td>
                <Td>
                  {e.source === "RIDER_FULFILLED"
                    ? "Rider fulfilled"
                    : "Customer link"}
                </Td>
                <Td>{e.counterpartyName ?? "Customer"}</Td>
                <Td>{ngn(e.totalAmountMinor)}</Td>
                <Td>{ngn(e.earningsMinor)}</Td>
                <Td>
                  <Badge
                    tone={e.status === "COMPLETED" ? "success" : "warning"}
                  >
                    {e.status}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
      <CashOutModal
        open={cash}
        close={() => setCash(false)}
        available={Math.round(Number(s.settlement.settled_balance) * 100)}
      />
    </div>
  );
}
async function downloadSettlement(from: string, to: string) {
  const blob = await apiDownload(
    `/reports/settlements.csv?from=${from}&to=${to}`,
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "settlement-report.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}
function PinStep({
  purpose,
  onToken,
}: {
  purpose: "CASH_OUT" | "TRANSFER" | "VAS";
  onToken: (t: string) => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const verify = useMutation({
    mutationFn: () =>
      apiRequest<{ challengeToken: string }>("/account/pin/verify", {
        method: "POST",
        body: JSON.stringify({ pin, purpose }),
      }),
    onSuccess: (r) => onToken(r.challengeToken),
    onError: () => setError("PIN verification failed"),
  });
  return (
    <div className="space-y-4">
      <FormField label="Transaction PIN" error={error}>
        <PinInput
          autoComplete="one-time-code"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
      </FormField>
      <Button
        className="w-full"
        loading={verify.isPending}
        onClick={() => verify.mutate()}
      >
        Authorize
      </Button>
    </div>
  );
}
function CashOutModal({
  open,
  close,
  available,
}: {
  open: boolean;
  close: () => void;
  available: number;
}) {
  const client = useQueryClient();
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      apiRequest("/account/cash-out", {
        method: "POST",
        headers: { "idempotency-key": idempotency() },
        body: JSON.stringify({
          amountMinor: Math.round(Number(amount) * 100),
          challengeToken: token,
        }),
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["account-summary"] });
      close();
    },
  });
  return (
    <Modal
      isOpen={open}
      onOpenChange={(v) => !v && close()}
      title="Cash out to wallet"
      description={`Available: ${ngn(available)}`}
    >
      {token ? (
        <div className="space-y-4">
          <FormField label="Amount">
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </FormField>
          {mutation.isError && (
            <Alert tone="danger" title="Cash out failed">
              Check the amount and try again.
            </Alert>
          )}
          <Button
            className="w-full"
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Move funds to wallet
          </Button>
        </div>
      ) : (
        <PinStep purpose="CASH_OUT" onToken={setToken} />
      )}
    </Modal>
  );
}
function WalletView() {
  const summary = useWallet();
  const statement = useQuery({
    queryKey: ["wallet-statement"],
    queryFn: () => apiRequest<Statement>("/account/wallet/statement"),
  });
  const [modal, setModal] = useState<
    "fund" | "transfer" | "vas" | "pin" | null
  >(null);
  const [vasType, setVasType] = useState<VasType>("airtime");
  if (summary.isLoading) return <Skeleton className="mt-6 h-48" />;
  if (!summary.data)
    return (
      <Alert tone="danger" title="Wallet unavailable">
        Try again shortly.
      </Alert>
    );
  const w = summary.data.wallet;
  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <p className="text-sm text-muted">Wallet balance</p>
          <p className="mt-3 text-3xl font-bold text-foreground">
            {moneyString(w.balance)}
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted">Account number</p>
              <p className="font-semibold text-foreground">
                {w.account.account_number}
              </p>
            </div>
            <div>
              <p className="text-muted">Bank</p>
              <p className="font-semibold text-foreground">
                {w.account.bank_name}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-muted">Account name</p>
              <p className="font-semibold text-foreground">
                {w.account.account_name}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">Wallet actions</h2>
          <div className="mt-4 grid gap-3">
            <Button onClick={() => setModal("fund")} variant="secondary">
              <Banknote className="size-4" />
              Add funds
            </Button>
            <Button onClick={() => setModal("transfer")}>
              <Send className="size-4" />
              Transfer out
            </Button>
            <Button onClick={() => setModal("pin")} variant="ghost">
              Set or reset transaction PIN
            </Button>
          </div>
        </Card>
      </div>
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold">Pay &amp; recharge</h2>
            <p className="mt-1 text-sm text-muted">
              Everyday services paid directly from your Pepsa wallet.
            </p>
          </div>
          <Badge tone="success" dot>
            Secure wallet payment
          </Badge>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {VAS_SERVICES.map(
            ({ key, label, description, icon: Icon, accent }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setVasType(key);
                  setModal("vas");
                }}
                className="group rounded-xl border border-border bg-panel p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <span
                  className={`grid size-10 place-items-center rounded-xl ${accent}`}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="mt-4 flex items-center justify-between gap-2 font-semibold">
                  {label}
                  <ChevronRight className="size-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-brand" />
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted">
                  {description}
                </span>
              </button>
            ),
          )}
        </div>
      </Card>
      <Card>
        <h2 className="mb-4 font-semibold">Statement of account</h2>
        <Table>
          <THead>
            <Tr>
              <Th>Transaction</Th>
              <Th>Date</Th>
              <Th>Description</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Receipt</Th>
            </Tr>
          </THead>
          <TBody>
            {(statement.data?.data ?? []).map((t) => (
              <Tr key={t.transaction_id}>
                <Td>
                  <Link
                    className="font-semibold text-brand hover:underline"
                    to={`/account/transactions/${t.transaction_id}`}
                  >
                    {t.transaction_id.slice(0, 8)}
                  </Link>
                </Td>
                <Td>{new Date(t.created_at).toLocaleString()}</Td>
                <Td>{t.narration ?? t.type}</Td>
                <Td>{moneyString(t.amount)}</Td>
                <Td>
                  <Badge
                    tone={t.status === "successful" ? "success" : "warning"}
                  >
                    {t.status}
                  </Badge>
                </Td>
                <Td>
                  <Link
                    className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
                    to={`/account/transactions/${t.transaction_id}`}
                  >
                    View details
                    <ChevronRight className="size-3.5" />
                  </Link>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
      <Modal
        isOpen={modal === "fund"}
        onOpenChange={(v) => !v && setModal(null)}
        title="Add funds"
      >
        <p className="text-sm text-muted">
          Make a bank transfer to <strong>{w.account.account_number}</strong>,{" "}
          {w.account.bank_name}. Verified deposits appear automatically.
        </p>
      </Modal>
      <TransferModal open={modal === "transfer"} close={() => setModal(null)} />
      <VasModalV2
        open={modal === "vas"}
        close={() => setModal(null)}
        initialType={vasType}
      />
      <PinModal open={modal === "pin"} close={() => setModal(null)} />
    </div>
  );
}
function TransferModal({ open, close }: { open: boolean; close: () => void }) {
  const [token, setToken] = useState("");
  const [scope, setScope] = useState<"internal" | "external">("internal");
  const [account, setAccount] = useState("");
  const [bank, setBank] = useState("");
  const [bankSearch, setBankSearch] = useState("");
  const [amount, setAmount] = useState("");
  const banks = useQuery({
    queryKey: ["banks"],
    queryFn: () => apiRequest<Bank[]>("/account/banks"),
    enabled: open && scope === "external",
  });
  const filteredBanks = (banks.data ?? []).filter((item) =>
    `${item.name} ${item.code}`
      .toLowerCase()
      .includes(bankSearch.trim().toLowerCase()),
  );
  const selectedBank = (banks.data ?? []).find((item) => item.code === bank);
  const transfer = useMutation({
    mutationFn: () =>
      apiRequest("/account/transfers", {
        method: "POST",
        headers: { "idempotency-key": idempotency() },
        body: JSON.stringify({
          scope,
          amountMinor: Math.round(Number(amount) * 100),
          recipient:
            scope === "internal"
              ? { counterpartyAccountNumber: account }
              : {
                  destinationAccountNumber: account,
                  destinationBankCode: bank,
                },
          challengeToken: token,
        }),
      }),
    onSuccess: close,
  });
  return (
    <Modal
      isOpen={open}
      onOpenChange={(v) => !v && close()}
      title="Transfer out"
    >
      {!token ? (
        <PinStep purpose="TRANSFER" onToken={setToken} />
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant={scope === "internal" ? "primary" : "secondary"}
              onClick={() => setScope("internal")}
            >
              Pepsa account
            </Button>
            <Button
              variant={scope === "external" ? "primary" : "secondary"}
              onClick={() => setScope("external")}
            >
              Bank account
            </Button>
          </div>
          {scope === "external" && (
            <FormField label="Bank">
              {selectedBank ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
                  <span className="text-sm font-medium">
                    {selectedBank.name}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setBank("")}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <SearchInput
                    aria-label="Search banks"
                    placeholder="Search banks"
                    value={bankSearch}
                    onChange={setBankSearch}
                  />
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-border">
                    {banks.isLoading ? (
                      <p className="p-3 text-sm text-muted">Loading banks…</p>
                    ) : filteredBanks.length === 0 ? (
                      <p className="p-3 text-sm text-muted">No banks found</p>
                    ) : (
                      filteredBanks.map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          className="flex w-full items-center justify-between gap-2 border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-neutral-50"
                          onClick={() => {
                            setBank(item.code);
                            setBankSearch("");
                          }}
                        >
                          <span className="font-medium">{item.name}</span>
                          <span className="text-xs text-muted">
                            {item.code}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </FormField>
          )}
          <FormField label="Account number">
            <Input
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            />
          </FormField>
          <FormField label="Amount">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </FormField>
          <Button
            className="w-full"
            loading={transfer.isPending}
            onClick={() => transfer.mutate()}
          >
            Review and transfer
          </Button>
        </div>
      )}
    </Modal>
  );
}
const MOBILE_NETWORKS = ["MTN", "AIRTEL", "GLO", "9MOBILE"] as const;
type VasType = "airtime" | "data" | "electricity" | "cable_tv";
type VasStage = "provider" | "details" | "review" | "authorize" | "success";
const VAS_SERVICES: Array<{
  key: VasType;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof Phone;
  accent: string;
}> = [
  {
    key: "airtime",
    label: "Airtime",
    shortLabel: "Airtime",
    description: "Top up any Nigerian mobile number.",
    icon: Phone,
    accent: "bg-emerald-50 text-emerald-700",
  },
  {
    key: "data",
    label: "Mobile data",
    shortLabel: "Data",
    description: "Choose a live bundle for any network.",
    icon: Wifi,
    accent: "bg-sky-50 text-sky-700",
  },
  {
    key: "cable_tv",
    label: "TV subscription",
    shortLabel: "TV",
    description: "Renew cable and streaming packages.",
    icon: Tv,
    accent: "bg-violet-50 text-violet-700",
  },
  {
    key: "electricity",
    label: "Electricity",
    shortLabel: "Power",
    description: "Pay prepaid and postpaid meter bills.",
    icon: Lightbulb,
    accent: "bg-amber-50 text-amber-700",
  },
];
const AIRTIME_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

function catalogValue(item: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value))
      return String(value);
  }
  return undefined;
}

function ChoiceButtons({
  label,
  options,
  selectedKey,
  onSelect,
  helper,
}: {
  label: string;
  options: Array<{ key: string; label: string }>;
  selectedKey: string;
  onSelect: (key: string) => void;
  helper?: string;
}) {
  return (
    <FormField label={label}>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.key === selectedKey;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onSelect(option.key)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                selected
                  ? "border-brand bg-brand-50 text-brand"
                  : "border-border bg-panel text-foreground hover:bg-neutral-50"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {helper ? <p className="mt-1.5 text-xs text-muted">{helper}</p> : null}
    </FormField>
  );
}

function VasModalV2({
  open,
  close,
  initialType,
}: {
  open: boolean;
  close: () => void;
  initialType: VasType;
}) {
  type CatalogItem = {
    id?: string;
    productId?: string;
    name: string;
    amount?: string;
  };
  type BillerField = {
    name: string;
    label: string;
    required?: boolean;
    type?: string;
  };
  type Validation = {
    validation_reference: string;
    customer_name?: string;
    customerName?: string;
    name?: string;
  };
  const client = useQueryClient();
  const [stage, setStage] = useState<VasStage>("details");
  const [type, setType] = useState<VasType>(initialType);
  const [token, setToken] = useState("");
  const [provider, setProvider] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [amount, setAmount] = useState("");
  const [productId, setProductId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [billerId, setBillerId] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [validationReference, setValidationReference] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [formError, setFormError] = useState("");
  const [providerSearch, setProviderSearch] = useState("");
  const mobile = type === "airtime" || type === "data";
  const utility = type === "electricity" || type === "cable_tv";
  const service = VAS_SERVICES.find((item) => item.key === type)!;

  useEffect(() => {
    if (!open) return;
    setType(initialType);
    setStage(
      initialType === "electricity" || initialType === "cable_tv"
        ? "provider"
        : "details",
    );
    setToken("");
    setProvider("");
    setBeneficiary("");
    setAmount("");
    setProductId("");
    setCategoryId("");
    setBillerId("");
    setFields({});
    setValidationReference("");
    setCustomerName("");
    setFormError("");
    setProviderSearch("");
  }, [initialType, open]);

  const detected = useQuery({
    queryKey: ["vas-network", beneficiary],
    queryFn: async () => {
      const response = await apiRequest<Record<string, unknown>>(
        `/account/vas/catalog?path=${encodeURIComponent(`networks/detect?phone=${beneficiary}`)}`,
      );
      const nested =
        response.data && typeof response.data === "object"
          ? (response.data as Record<string, unknown>)
          : response;
      return {
        network:
          catalogValue(nested, [
            "network",
            "networkName",
            "network_name",
            "provider",
            "providerName",
          ]) ?? "",
      };
    },
    enabled: open && mobile && beneficiary.replace(/\D/g, "").length >= 10,
  });
  useEffect(() => {
    if (!mobile) return;
    const network = detected.data?.network?.toUpperCase();
    if (network) setProvider(network);
  }, [detected.data?.network, mobile]);
  const plans = useQuery({
    queryKey: ["vas-plans", beneficiary],
    queryFn: async () => {
      const items = await apiRequest<Record<string, unknown>[]>(
        `/account/vas/catalog?path=${encodeURIComponent(`data-plans?phone=${beneficiary}`)}`,
      );
      return items
        .map((item) => ({
          productId: catalogValue(item, [
            "productId",
            "product_id",
            "planId",
            "plan_id",
            "id",
            "code",
          ]),
          name:
            catalogValue(item, [
              "name",
              "productName",
              "product_name",
              "planName",
              "plan_name",
              "description",
            ]) ?? "",
          amount: catalogValue(item, [
            "amount",
            "price",
            "faceValue",
            "face_value",
          ]),
        }))
        .filter((item) => item.productId && item.name && item.amount);
    },
    enabled: open && type === "data" && Boolean(detected.data?.network),
  });
  const categories = useQuery({
    queryKey: ["vas-categories"],
    queryFn: () =>
      apiRequest<CatalogItem[]>(
        "/account/vas/catalog?path=billers%2Fcategories",
      ),
    enabled: open && utility,
  });
  const matchedCategories = (categories.data ?? []).filter((item) => {
    const name = item.name.toLowerCase();
    return type === "electricity"
      ? /electric|power|energy/.test(name)
      : /cable|television|\btv\b|entertain/.test(name);
  });
  const visibleCategories = matchedCategories.length
    ? matchedCategories
    : (categories.data ?? []);
  useEffect(() => {
    if (!utility || categoryId || visibleCategories.length === 0) return;
    const category = visibleCategories[0];
    if (category?.id) setCategoryId(category.id);
  }, [categoryId, utility, visibleCategories]);
  const billers = useQuery({
    queryKey: ["vas-billers", categoryId],
    queryFn: () =>
      apiRequest<CatalogItem[]>(
        `/account/vas/catalog?path=${encodeURIComponent(`billers/categories/${categoryId}`)}`,
      ),
    enabled: open && utility && Boolean(categoryId),
  });
  const billerFields = useQuery({
    queryKey: ["vas-biller-fields", billerId],
    queryFn: async () => {
      const items = await apiRequest<Record<string, unknown>[]>(
        `/account/vas/catalog?path=${encodeURIComponent(`billers/${billerId}/fields`)}`,
      );
      return items
        .map((item): BillerField => {
          const name =
            catalogValue(item, [
              "name",
              "fieldName",
              "field_name",
              "key",
              "id",
            ]) ?? "";
          return {
            name,
            label:
              catalogValue(item, [
                "label",
                "displayName",
                "display_name",
                "fieldLabel",
                "field_label",
                "title",
              ]) ?? name,
            required: Boolean(
              item.required ?? item.isRequired ?? item.is_required ?? false,
            ),
            type:
              catalogValue(item, ["type", "fieldType", "field_type"]) ??
              "string",
          };
        })
        .filter((item) => item.name && item.label);
    },
    enabled: open && utility && Boolean(billerId),
  });
  const validate = useMutation({
    mutationFn: async () => {
      const response = await apiRequest<Validation & Record<string, unknown>>(
        "/account/vas/validate",
        {
          method: "POST",
          body: JSON.stringify({
            billerId,
            beneficiaryIdentifier: beneficiary,
            fields,
          }),
        },
      );
      const nested =
        response.data && typeof response.data === "object"
          ? (response.data as Record<string, unknown>)
          : response;
      return {
        validation_reference:
          catalogValue(nested, [
            "validation_reference",
            "validationReference",
            "reference",
            "transactionReference",
          ]) ?? "",
        customer_name: catalogValue(nested, [
          "customer_name",
          "customerName",
          "name",
          "accountName",
          "account_name",
        ]),
      };
    },
    onSuccess: (result) => {
      if (!result.validation_reference) {
        setFormError(
          "The provider did not return a validation reference. Try again.",
        );
        return;
      }
      setValidationReference(result.validation_reference);
      setCustomerName(result.customer_name ?? "");
      setStage("review");
    },
    onError: () =>
      setFormError(
        `We could not verify this ${type === "electricity" ? "meter" : "smartcard"}. Check the details and try again.`,
      ),
  });
  const buy = useMutation({
    mutationFn: () =>
      apiRequest("/account/vas/purchases", {
        method: "POST",
        headers: { "idempotency-key": idempotency() },
        body: JSON.stringify({
          productType: type,
          productProvider: provider || detected.data?.network || billerId,
          beneficiaryIdentifier: beneficiary,
          amountMinor: Math.round(Number(amount) * 100),
          productId: productId || undefined,
          billerId: billerId || undefined,
          validationReference: validationReference || undefined,
          customerFields: utility ? fields : undefined,
          challengeToken: token,
        }),
      }),
    onSuccess: () => {
      setStage("success");
      void client.invalidateQueries({ queryKey: ["wallet-summary"] });
      void client.invalidateQueries({ queryKey: ["wallet-statement"] });
    },
  });
  useEffect(() => {
    if (stage === "authorize" && token && buy.status === "idle") buy.mutate();
  }, [stage, token, buy.status]);

  const selectedPlan = (plans.data ?? []).find(
    (item) => item.productId === productId,
  );
  const selectedBiller = (billers.data ?? []).find(
    (item) => item.id === billerId,
  );
  const filteredBillers = (billers.data ?? []).filter(
    (item) =>
      item.id &&
      `${item.name} ${item.id}`
        .toLowerCase()
        .includes(providerSearch.trim().toLowerCase()),
  );
  const amountMinor = Math.round(Number(amount) * 100);
  const identifierLabel =
    type === "electricity"
      ? "Meter number"
      : type === "cable_tv"
        ? "Smartcard or customer number"
        : "Mobile number";
  const canContinue =
    beneficiary.replace(/\s/g, "").length >= (mobile ? 10 : 4) &&
    amountMinor > 0 &&
    (mobile
      ? Boolean(provider || detected.data?.network)
      : Boolean(billerId)) &&
    (type !== "data" || Boolean(productId)) &&
    (!utility ||
      (billerFields.data ?? []).every(
        (field) => !field.required || Boolean(fields[field.name]?.trim()),
      ));
  const changeType = (next: VasType) => {
    setType(next);
    setStage(
      next === "electricity" || next === "cable_tv" ? "provider" : "details",
    );
    setProvider("");
    setProductId("");
    setAmount("");
    setCategoryId("");
    setBillerId("");
    setFields({});
    setValidationReference("");
    setCustomerName("");
    setFormError("");
    setProviderSearch("");
  };
  const continueToReview = () => {
    setFormError("");
    if (!canContinue)
      return setFormError("Complete all required details before you continue.");
    if (utility) validate.mutate();
    else setStage("review");
  };

  return (
    <Modal
      isOpen={open}
      onOpenChange={(value) => !value && close()}
      title="Pay & recharge"
      description="Fast, secure payments from your Pepsa wallet"
      size="xl"
      footer={
        stage === "details" ? (
          <Button
            className="w-full sm:w-auto sm:min-w-52"
            disabled={!canContinue || (utility && billerFields.isLoading)}
            loading={validate.isPending}
            onClick={continueToReview}
          >
            {utility ? "Verify details" : "Review payment"}
            <ChevronRight className="size-4" />
          </Button>
        ) : stage === "review" ? (
          <Button
            className="w-full sm:w-auto sm:min-w-64"
            onClick={() => setStage("authorize")}
          >
            Continue to secure payment
            <ShieldCheck className="size-4" />
          </Button>
        ) : stage === "success" ? (
          <Button className="w-full sm:w-auto sm:min-w-40" onClick={close}>
            Done
          </Button>
        ) : undefined
      }
    >
      {stage === "success" ? (
        <div className="mx-auto max-w-md py-6 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-success-50 text-success-700">
            <CheckCircle2 className="size-8" />
          </span>
          <h3 className="mt-5 text-xl font-bold">Payment submitted</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            Your {service.label.toLowerCase()} payment is being processed. Track
            its final status in your wallet statement.
          </p>
          <div className="mt-6 space-y-3 rounded-xl border border-border bg-neutral-50 p-4 text-left text-sm">
            <SummaryRow label="Service" value={service.label} />
            <SummaryRow label="Recipient" value={beneficiary} />
            <SummaryRow label="Amount" value={ngn(amountMinor)} strong />
          </div>
        </div>
      ) : (
        <div className="grid min-h-[30rem] gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <aside className="rounded-xl bg-neutral-50 p-3">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Choose a service
            </p>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              {VAS_SERVICES.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    disabled={stage !== "details"}
                    onClick={() => changeType(item.key)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${item.key === type ? "border-brand-200 bg-panel text-brand shadow-sm" : "border-transparent hover:bg-panel"} disabled:opacity-60`}
                  >
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-lg ${item.accent}`}
                    >
                      <Icon className="size-4" />
                    </span>
                    {item.shortLabel}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 hidden border-t border-border px-2 pt-4 text-xs leading-5 text-muted lg:block">
              <ShieldCheck className="mb-2 size-5 text-brand" />
              Review every detail before your transaction PIN is requested.
            </div>
          </aside>
          <div className="min-w-0">
            {stage === "provider" && (
              <div className="mx-auto max-w-xl">
                <div className="flex items-center gap-3">
                  <span
                    className={`grid size-11 place-items-center rounded-xl ${service.accent}`}
                  >
                    {type === "electricity" ? (
                      <Zap className="size-5" />
                    ) : (
                      <Tv className="size-5" />
                    )}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">
                      Choose your{" "}
                      {type === "electricity" ? "electricity" : "TV"} provider
                    </h3>
                    <p className="text-sm text-muted">
                      Select a provider from the live Pepsa Pay catalog.
                    </p>
                  </div>
                </div>
                {categories.isLoading ||
                (Boolean(categoryId) && billers.isLoading) ||
                (!categoryId && !categories.isError) ? (
                  <CatalogLoader label="Fetching available providers…" />
                ) : categories.isError || billers.isError ? (
                  <Alert
                    className="mt-6"
                    tone="danger"
                    title="Providers unavailable"
                  >
                    We could not load providers from Pepsa Pay. Close this
                    window and try again.
                  </Alert>
                ) : (
                  <>
                    <SearchInput
                      className="mt-6"
                      aria-label="Search providers"
                      placeholder="Search providers"
                      value={providerSearch}
                      onChange={setProviderSearch}
                    />
                    <div className="mt-4 max-h-[22rem] space-y-2 overflow-y-auto pr-1">
                      {filteredBillers.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setBillerId(item.id ?? "");
                            setFields({});
                            setValidationReference("");
                            setStage("details");
                          }}
                          className="group flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-panel p-4 text-left transition hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        >
                          <span>
                            <span className="block font-semibold">
                              {item.name}
                            </span>
                            <span className="mt-1 block text-xs text-muted">
                              {type === "electricity"
                                ? "Electricity distribution provider"
                                : "TV subscription provider"}
                            </span>
                          </span>
                          <ChevronRight className="size-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-brand" />
                        </button>
                      ))}
                      {filteredBillers.length === 0 && (
                        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
                          No provider matches “{providerSearch}”.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
            {stage === "details" && utility && billerFields.isLoading ? (
              <CatalogLoader label="Preparing provider fields…" />
            ) : (
              stage === "details" && (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_16rem]">
                  <div className="space-y-5">
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid size-11 place-items-center rounded-xl ${service.accent}`}
                      >
                        {type === "airtime" ? (
                          <Phone className="size-5" />
                        ) : type === "data" ? (
                          <Wifi className="size-5" />
                        ) : type === "electricity" ? (
                          <Zap className="size-5" />
                        ) : (
                          <Tv className="size-5" />
                        )}
                      </span>
                      <div>
                        <h3 className="text-lg font-bold">{service.label}</h3>
                        <p className="text-sm text-muted">
                          {service.description}
                        </p>
                      </div>
                    </div>
                    {formError && (
                      <Alert tone="danger" title="Check your details">
                        {formError}
                      </Alert>
                    )}
                    <FormField label={identifierLabel}>
                      <div className="relative">
                        <Smartphone className="pointer-events-none absolute left-3 top-3 size-4 text-muted" />
                        <Input
                          className="pl-10"
                          inputMode="numeric"
                          placeholder={
                            mobile
                              ? "0801 234 5678"
                              : `Enter ${identifierLabel.toLowerCase()}`
                          }
                          value={beneficiary}
                          onChange={(event) => {
                            setBeneficiary(event.target.value);
                            setValidationReference("");
                            if (mobile) {
                              setProvider("");
                              setProductId("");
                              if (type === "data") setAmount("");
                            }
                          }}
                        />
                      </div>
                    </FormField>
                    {mobile &&
                      beneficiary.replace(/\D/g, "").length >= 10 &&
                      (detected.isFetching ? (
                        <CatalogLoader
                          label="Detecting mobile network…"
                          compact
                        />
                      ) : detected.isError ? (
                        <Alert tone="danger" title="Network not detected">
                          Check the mobile number and try again.
                        </Alert>
                      ) : detected.data?.network ? (
                        <div className="flex items-center justify-between rounded-xl border border-brand-100 bg-brand-50/60 p-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                              Network detected by Pepsa Pay
                            </p>
                            <p className="mt-1 font-bold">
                              {detected.data.network.toUpperCase()}
                            </p>
                          </div>
                          <CheckCircle2 className="size-5 text-success-700" />
                        </div>
                      ) : null)}
                    {type === "data" && plans.isFetching && (
                      <CatalogLoader
                        label="Fetching available data bundles…"
                        compact
                      />
                    )}
                    {type === "data" && !plans.isFetching && plans.data && (
                      <Select
                        label="Data bundle"
                        placeholder={
                          plans.isLoading
                            ? "Loading live bundles…"
                            : "Choose a bundle"
                        }
                        options={(plans.data ?? []).map((plan) => ({
                          key: plan.productId ?? "",
                          label: `${plan.name}${plan.amount ? ` — ${moneyString(plan.amount)}` : ""}`,
                          disabled: !plan.productId,
                        }))}
                        selectedKey={productId || null}
                        onSelectionChange={(key) => {
                          const selected = String(key);
                          setProductId(selected);
                          const plan = plans.data?.find(
                            (item) => item.productId === selected,
                          );
                          if (plan?.amount) setAmount(plan.amount);
                        }}
                      />
                    )}
                    {type === "data" && plans.isError && (
                      <Alert tone="danger" title="Bundles unavailable">
                        Pepsa Pay could not load data bundles for this number.
                        Check the number and try again.
                      </Alert>
                    )}
                    {type === "data" &&
                      !plans.isFetching &&
                      plans.isSuccess &&
                      plans.data.length === 0 && (
                        <Alert tone="warning" title="No bundles returned">
                          There are currently no selectable bundles for the
                          detected network.
                        </Alert>
                      )}
                    {utility && (
                      <>
                        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-neutral-50 p-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                              Selected provider
                            </p>
                            <p className="mt-1 font-bold">
                              {selectedBiller?.name ?? "Provider"}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setStage("provider");
                              setBillerId("");
                              setFields({});
                            }}
                          >
                            Change
                          </Button>
                        </div>
                        {billerFields.data?.map((field) => (
                          <FormField
                            key={field.name}
                            label={`${field.label}${field.required ? " *" : ""}`}
                          >
                            <Input
                              required={field.required}
                              value={fields[field.name] ?? ""}
                              onChange={(event) => {
                                setFields((current) => ({
                                  ...current,
                                  [field.name]: event.target.value,
                                }));
                                setValidationReference("");
                              }}
                            />
                          </FormField>
                        ))}
                      </>
                    )}
                    {type !== "data" && (
                      <FormField label="Amount">
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-2.5 text-sm font-semibold text-muted">
                            ₦
                          </span>
                          <Input
                            className="pl-8 text-base font-semibold"
                            type="number"
                            min="1"
                            step="1"
                            placeholder="0.00"
                            value={amount}
                            onChange={(event) => setAmount(event.target.value)}
                          />
                        </div>
                      </FormField>
                    )}
                    {type === "airtime" && (
                      <div className="flex flex-wrap gap-2">
                        {AIRTIME_AMOUNTS.map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setAmount(String(value))}
                            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${Number(amount) === value ? "border-brand bg-brand-50 text-brand" : "border-border hover:border-brand-200 hover:bg-brand-50"}`}
                          >
                            ₦{value.toLocaleString()}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <VasHelpCard type={type} />
                </div>
              )
            )}
            {stage === "review" && (
              <div className="mx-auto max-w-lg">
                <StepBack
                  onClick={() => setStage("details")}
                  label="Edit details"
                />
                <div className="mt-4 rounded-2xl border border-border bg-neutral-50 p-5">
                  <div className="flex items-center gap-3 border-b border-border pb-4">
                    <span
                      className={`grid size-11 place-items-center rounded-xl ${service.accent}`}
                    >
                      <ReceiptText className="size-5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Review payment
                      </p>
                      <h3 className="font-bold">{service.label}</h3>
                    </div>
                  </div>
                  <div className="space-y-3 py-4 text-sm">
                    <SummaryRow label={identifierLabel} value={beneficiary} />
                    <SummaryRow
                      label="Provider"
                      value={
                        selectedBiller?.name ??
                        provider ??
                        detected.data?.network ??
                        "—"
                      }
                    />
                    {selectedPlan && (
                      <SummaryRow label="Bundle" value={selectedPlan.name} />
                    )}
                    {customerName && (
                      <SummaryRow label="Customer" value={customerName} />
                    )}
                  </div>
                  <div className="flex items-end justify-between border-t border-border pt-4">
                    <span className="text-sm text-muted">Total</span>
                    <span className="text-2xl font-bold">
                      {ngn(amountMinor)}
                    </span>
                  </div>
                </div>
                <Alert
                  className="mt-4"
                  tone="warning"
                  title="Please check carefully"
                >
                  {mobile
                    ? "Airtime and data sent to a wrong number may not be reversible."
                    : "Confirm the verified customer and service details before authorizing."}
                </Alert>
              </div>
            )}
            {stage === "authorize" && !token && (
              <div className="mx-auto max-w-md">
                <StepBack
                  onClick={() => setStage("review")}
                  label="Back to review"
                />
                <div className="mt-5 text-center">
                  <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand-50 text-brand">
                    <ShieldCheck className="size-6" />
                  </span>
                  <h3 className="mt-3 text-lg font-bold">
                    Authorize {ngn(amountMinor)}
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    Enter your transaction PIN to pay securely.
                  </p>
                </div>
                <div className="mt-5">
                  <PinStep purpose="VAS" onToken={setToken} />
                </div>
              </div>
            )}
            {stage === "authorize" && token && (
              <div className="mx-auto max-w-md py-10 text-center">
                {buy.isError ? (
                  <>
                    <Alert tone="danger" title="Payment could not be completed">
                      Your wallet was not charged. Return to review and try
                      again.
                    </Alert>
                    <Button
                      className="mt-4 w-full"
                      variant="outline"
                      onClick={() => {
                        setToken("");
                        setStage("review");
                        buy.reset();
                      }}
                    >
                      Back to review
                    </Button>
                  </>
                ) : (
                  <>
                    <LoaderCircle className="mx-auto size-10 animate-spin text-brand" />
                    <h3 className="mt-4 text-lg font-bold">
                      Processing payment
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      Please keep this window open.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span
        className={`max-w-[65%] text-right ${strong ? "font-bold" : "font-semibold"}`}
      >
        {value}
      </span>
    </div>
  );
}
function CatalogLoader({
  label,
  compact = false,
}: {
  label: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`grid place-items-center rounded-xl border border-dashed border-border bg-neutral-50 text-center ${compact ? "min-h-24 p-4" : "mt-6 min-h-72 p-8"}`}
      role="status"
    >
      <div>
        <LoaderCircle className="mx-auto size-7 animate-spin text-brand" />
        <p className="mt-3 text-sm font-semibold">{label}</p>
        <p className="mt-1 text-xs text-muted">
          Getting the latest information from Pepsa Pay.
        </p>
      </div>
    </div>
  );
}
function StepBack({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-brand"
    >
      <ArrowLeft className="size-4" />
      {label}
    </button>
  );
}
function VasHelpCard({ type }: { type: VasType }) {
  const content = {
    airtime: [
      Gauge,
      "Instant top-up",
      "The network is detected from the number. Check it if the line was recently ported.",
    ],
    data: [
      Wifi,
      "Live bundles",
      "Available packages and prices come directly from the current service catalog.",
    ],
    electricity: [
      Zap,
      "Meter verification",
      "We verify meter details before payment. Prepaid tokens are delivered by the provider.",
    ],
    cable_tv: [
      Tv,
      "Smartcard verification",
      "Confirm the customer or smartcard details and package before authorizing payment.",
    ],
  } as const;
  const [Icon, title, description] = content[type];
  return (
    <aside className="h-fit rounded-xl border border-brand-100 bg-brand-50/60 p-4">
      <Icon className="size-5 text-brand" />
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
      <div className="mt-4 border-t border-brand-100 pt-2">
        {[
          "Review before payment",
          "PIN protected",
          "Status in wallet statement",
        ].map((item) => (
          <p key={item} className="mt-2 flex items-center gap-2 text-xs">
            <Check className="size-3.5 text-success-700" />
            {item}
          </p>
        ))}
      </div>
    </aside>
  );
}

export function VasModal({
  open,
  close,
}: {
  open: boolean;
  close: () => void;
}) {
  const [token, setToken] = useState("");
  const [type, setType] = useState("airtime");
  const [provider, setProvider] = useState("");
  const [providerManual, setProviderManual] = useState(false);
  const [beneficiary, setBeneficiary] = useState("");
  const [amount, setAmount] = useState("");
  const [productId, setProductId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [billerId, setBillerId] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  type CatalogItem = {
    id?: string;
    productId?: string;
    name: string;
    amount?: string;
  };
  type BillerField = {
    name: string;
    label: string;
    required?: boolean;
    type?: string;
  };
  const mobile = type === "airtime" || type === "data";
  const utility = type === "electricity" || type === "cable_tv";
  const detected = useQuery({
    queryKey: ["vas-network", beneficiary],
    queryFn: () =>
      apiRequest<{ network: string }>(
        `/account/vas/catalog?path=${encodeURIComponent(`networks/detect?phone=${beneficiary}`)}`,
      ),
    enabled: open && mobile && beneficiary.replace(/\D/g, "").length >= 10,
  });
  useEffect(() => {
    if (!mobile || providerManual) return;
    const network = detected.data?.network?.toUpperCase();
    if (!network) return;
    const match = MOBILE_NETWORKS.find((item) => item === network);
    if (match) setProvider(match);
  }, [detected.data?.network, mobile, providerManual]);
  const plans = useQuery({
    queryKey: ["vas-plans", beneficiary],
    queryFn: () =>
      apiRequest<CatalogItem[]>(
        `/account/vas/catalog?path=${encodeURIComponent(`data-plans?phone=${beneficiary}`)}`,
      ),
    enabled:
      open && type === "data" && beneficiary.replace(/\D/g, "").length >= 10,
  });
  const categories = useQuery({
    queryKey: ["vas-categories"],
    queryFn: () =>
      apiRequest<CatalogItem[]>(
        "/account/vas/catalog?path=billers%2Fcategories",
      ),
    enabled: open && utility,
  });
  const billers = useQuery({
    queryKey: ["vas-billers", categoryId],
    queryFn: () =>
      apiRequest<CatalogItem[]>(
        `/account/vas/catalog?path=${encodeURIComponent(`billers/categories/${categoryId}`)}`,
      ),
    enabled: open && utility && Boolean(categoryId),
  });
  const billerFields = useQuery({
    queryKey: ["vas-biller-fields", billerId],
    queryFn: () =>
      apiRequest<BillerField[]>(
        `/account/vas/catalog?path=${encodeURIComponent(`billers/${billerId}/fields`)}`,
      ),
    enabled: open && utility && Boolean(billerId),
  });
  const buy = useMutation({
    mutationFn: async () => {
      const validation = utility
        ? await apiRequest<{ validation_reference: string }>(
            "/account/vas/validate",
            {
              method: "POST",
              body: JSON.stringify({
                billerId,
                beneficiaryIdentifier: beneficiary,
                fields,
              }),
            },
          )
        : undefined;
      return apiRequest("/account/vas/purchases", {
        method: "POST",
        headers: { "idempotency-key": idempotency() },
        body: JSON.stringify({
          productType: type,
          productProvider: provider || detected.data?.network || billerId,
          beneficiaryIdentifier: beneficiary,
          amountMinor: Math.round(Number(amount) * 100),
          productId: productId || undefined,
          billerId: billerId || undefined,
          validationReference: validation?.validation_reference,
          customerFields: utility ? fields : undefined,
          challengeToken: token,
        }),
      });
    },
    onSuccess: close,
  });
  return (
    <Modal
      isOpen={open}
      onOpenChange={(v) => !v && close()}
      title="Quick service"
    >
      {!token ? (
        <PinStep purpose="VAS" onToken={setToken} />
      ) : (
        <div className="space-y-3">
          <ChoiceButtons
            label="Service"
            selectedKey={type}
            onSelect={(key) => {
              setType(key);
              setProvider("");
              setProviderManual(false);
              setProductId("");
              setCategoryId("");
              setBillerId("");
              setFields({});
            }}
            options={[
              { key: "airtime", label: "Airtime" },
              { key: "data", label: "Data" },
              { key: "electricity", label: "Electricity" },
              { key: "cable_tv", label: "TV subscription" },
            ]}
          />
          <FormField label="Phone, meter or smartcard number">
            <Input
              value={beneficiary}
              onChange={(e) => {
                setBeneficiary(e.target.value);
                if (mobile) setProviderManual(false);
              }}
            />
          </FormField>
          {mobile && (
            <ChoiceButtons
              label="Provider"
              selectedKey={provider}
              onSelect={(key) => {
                setProvider(key);
                setProviderManual(true);
              }}
              options={MOBILE_NETWORKS.map((network) => ({
                key: network,
                label: network,
              }))}
              helper={
                detected.data?.network
                  ? `Detected: ${detected.data.network.toUpperCase()} — change if wrong`
                  : "Enter a phone number to auto-detect, or pick a provider"
              }
            />
          )}
          {type === "data" && (
            <Select
              label="Data plan"
              placeholder="Select a live plan"
              options={(plans.data ?? []).map((plan) => ({
                key: plan.productId ?? "",
                label: `${plan.name}${plan.amount ? ` — ₦${plan.amount}` : ""}`,
                disabled: !plan.productId,
              }))}
              selectedKey={productId || null}
              onSelectionChange={(key) => {
                const selected = String(key);
                setProductId(selected);
                const plan = plans.data?.find(
                  (item) => item.productId === selected,
                );
                if (plan?.amount) setAmount(plan.amount);
              }}
            />
          )}
          {utility && (
            <>
              <ChoiceButtons
                label="Service category"
                selectedKey={categoryId}
                onSelect={(key) => {
                  setCategoryId(key);
                  setBillerId("");
                  setFields({});
                }}
                options={(categories.data ?? [])
                  .filter((item) => item.id)
                  .map((item) => ({
                    key: item.id!,
                    label: item.name,
                  }))}
                helper={
                  categories.isLoading ? "Loading categories…" : undefined
                }
              />
              {categoryId ? (
                <ChoiceButtons
                  label="Biller"
                  selectedKey={billerId}
                  onSelect={(key) => {
                    setBillerId(key);
                    setFields({});
                  }}
                  options={(billers.data ?? [])
                    .filter((item) => item.id)
                    .map((item) => ({
                      key: item.id!,
                      label: item.name,
                    }))}
                  helper={billers.isLoading ? "Loading billers…" : undefined}
                />
              ) : null}
              {billerFields.data?.map((field) => (
                <FormField key={field.name} label={field.label}>
                  <Input
                    required={field.required}
                    value={fields[field.name] ?? ""}
                    onChange={(e) =>
                      setFields((current) => ({
                        ...current,
                        [field.name]: e.target.value,
                      }))
                    }
                  />
                </FormField>
              ))}
            </>
          )}
          <FormField label="Amount">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </FormField>
          <Button
            className="w-full"
            loading={buy.isPending}
            onClick={() => buy.mutate()}
          >
            Purchase
          </Button>
        </div>
      )}
    </Modal>
  );
}
function PinModal({ open, close }: { open: boolean; close: () => void }) {
  const [pin, setPin] = useState("");
  const [code, setCode] = useState("");
  const status = useQuery({
    queryKey: ["pin-status"],
    queryFn: () => apiRequest<{ enrolled: boolean }>("/account/pin"),
    enabled: open,
  });
  const request = useMutation({
    mutationFn: () =>
      apiRequest("/account/pin/reset/request", { method: "POST" }),
  });
  const save = useMutation({
    mutationFn: () =>
      apiRequest(
        status.data?.enrolled ? "/account/pin/reset" : "/account/pin",
        {
          method: "POST",
          body: JSON.stringify(status.data?.enrolled ? { pin, code } : { pin }),
        },
      ),
    onSuccess: close,
  });
  return (
    <Modal
      isOpen={open}
      onOpenChange={(v) => !v && close()}
      title={
        status.data?.enrolled ? "Reset transaction PIN" : "Set transaction PIN"
      }
    >
      <div className="space-y-3">
        {status.data?.enrolled && (
          <>
            <Button variant="secondary" onClick={() => request.mutate()}>
              Email reset code
            </Button>
            <FormField label="Reset code">
              <Input
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </FormField>
          </>
        )}
        <FormField label="New 4–6 digit PIN">
          <PinInput
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
        </FormField>
        <Button
          className="w-full"
          loading={save.isPending}
          onClick={() => save.mutate()}
        >
          Save PIN
        </Button>
      </div>
    </Modal>
  );
}
