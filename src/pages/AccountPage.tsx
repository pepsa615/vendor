import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseDate } from "@internationalized/date";
import {
  ArrowDownToLine,
  Banknote,
  CreditCard,
  Lightbulb,
  Phone,
  Send,
  Tv,
} from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
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
        <h2 className="font-semibold">Quick services</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [Phone, "Airtime"],
            [CreditCard, "Data"],
            [Tv, "TV subscription"],
            [Lightbulb, "Electricity"],
          ].map(([Icon, label]) => (
            <Button
              key={String(label)}
              variant="secondary"
              onClick={() => setModal("vas")}
            >
              <Icon className="size-4" />
              {String(label)}
            </Button>
          ))}
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
            </Tr>
          </THead>
          <TBody>
            {(statement.data?.data ?? []).map((t) => (
              <Tr key={t.transaction_id}>
                <Td>{t.transaction_id.slice(0, 8)}</Td>
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
      <VasModal open={modal === "vas"} close={() => setModal(null)} />
      <PinModal open={modal === "pin"} close={() => setModal(null)} />
    </div>
  );
}
function TransferModal({ open, close }: { open: boolean; close: () => void }) {
  const [token, setToken] = useState("");
  const [scope, setScope] = useState<"internal" | "external">("internal");
  const [account, setAccount] = useState("");
  const [bank, setBank] = useState("");
  const [amount, setAmount] = useState("");
  const banks = useQuery({
    queryKey: ["banks"],
    queryFn: () => apiRequest<Bank[]>("/account/banks"),
    enabled: open && scope === "external",
  });
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
            <Select
              label="Bank"
              placeholder="Select bank"
              options={(banks.data ?? []).map((b) => ({
                key: b.code,
                label: b.name,
              }))}
              selectedKey={bank || null}
              onSelectionChange={(key) => setBank(String(key))}
            />
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
function VasModal({ open, close }: { open: boolean; close: () => void }) {
  const [token, setToken] = useState("");
  const [type, setType] = useState("airtime");
  const [provider, setProvider] = useState("");
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
          <Select
            label="Service"
            options={[
              { key: "airtime", label: "Airtime" },
              { key: "data", label: "Data" },
              { key: "electricity", label: "Electricity" },
              { key: "cable_tv", label: "TV subscription" },
            ]}
            selectedKey={type}
            onSelectionChange={(key) => {
              setType(String(key));
              setProvider("");
              setProductId("");
              setCategoryId("");
              setBillerId("");
              setFields({});
            }}
          />
          <FormField label="Phone, meter or smartcard number">
            <Input
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
            />
          </FormField>
          {mobile && (
            <FormField label="Provider">
              <Input
                value={provider || detected.data?.network || ""}
                placeholder="Detected from phone number"
                onChange={(e) => setProvider(e.target.value)}
              />
            </FormField>
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
              <Select
                label="Service category"
                placeholder="Select a live category"
                options={(categories.data ?? []).map((item) => ({
                  key: item.id ?? "",
                  label: item.name,
                  disabled: !item.id,
                }))}
                selectedKey={categoryId || null}
                onSelectionChange={(key) => {
                  setCategoryId(String(key));
                  setBillerId("");
                  setFields({});
                }}
              />
              <Select
                label="Biller"
                placeholder="Select a live biller"
                options={(billers.data ?? []).map((item) => ({
                  key: item.id ?? "",
                  label: item.name,
                  disabled: !item.id,
                }))}
                selectedKey={billerId || null}
                onSelectionChange={(key) => {
                  setBillerId(String(key));
                  setFields({});
                }}
              />
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
