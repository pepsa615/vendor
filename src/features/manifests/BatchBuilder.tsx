import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../api/client.ts";
import type { OrderListResponse, VendorOrder } from "../orders/types.ts";
import type { Validation } from "./types.ts";
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Modal,
  SearchInput,
  Textarea,
} from "../../components/ui/index.ts";

const ready = (order: VendorOrder) =>
  !order.batchItem &&
  !(order.manifestItems?.length || order.dispatchItems?.length) &&
  ((order.source === "VENDOR_DIRECT" && order.status === "READY") ||
    (order.source === "CUSTOMER_LINK" &&
      order.status === "ACCEPTED" &&
      order.paymentStatus === "PAID"));

export function BatchBuilder({
  open,
  onOpenChange,
  initialOrderIds = [],
}: {
  open: boolean;
  onOpenChange(open: boolean): void;
  initialOrderIds?: string[];
}) {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(() => new Set(initialOrderIds));
  const [references, setReferences] = useState("");
  const [validation, setValidation] = useState<Validation | null>(null);
  const [error, setError] = useState("");
  const orders = useQuery({
    queryKey: ["orders", "batch-builder"],
    queryFn: () => apiRequest<OrderListResponse>("/orders?pageSize=100"),
    enabled: open,
  });
  const eligible = useMemo(
    () => (orders.data?.items ?? []).filter(ready),
    [orders.data],
  );
  const visible = eligible.filter((order) =>
    `${order.publicReference} ${order.sender.name} ${order.receiver.name} ${order.itemDescription}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const validate = useMutation({
    mutationFn: () =>
      apiRequest<Validation>("/manifests/batches/validate", {
        method: "POST",
        body: JSON.stringify(
          references.trim()
            ? {
                trackingIds: references
                  .split(/[\n,]/)
                  .map((value) => value.trim())
                  .filter(Boolean),
              }
            : { orderIds: [...selected] },
        ),
      }),
    onSuccess: (result) => {
      setValidation(result);
      setError("");
    },
    onError: (reason) =>
      setError(
        (reason as { message?: string }).message ?? "Unable to validate batch",
      ),
  });
  const create = useMutation({
    mutationFn: () =>
      apiRequest("/manifests/batches", {
        method: "POST",
        body: JSON.stringify({ previewToken: validation?.previewToken }),
      }),
    onSuccess: async () => {
      onOpenChange(false);
      setSelected(new Set());
      setValidation(null);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["batches"] }),
        client.invalidateQueries({ queryKey: ["orders"] }),
      ]);
    },
    onError: (reason) =>
      setError(
        (reason as { message?: string }).message ?? "Unable to create batch",
      ),
  });
  const toggle = (id: string, checked: boolean) => {
    setReferences("");
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
    setValidation(null);
  };
  return (
    <Modal
      isOpen={open}
      onOpenChange={onOpenChange}
      title="Create shipment batch"
      description="Select dispatch-ready orders, review their details, then finalize an immutable batch."
      size="xl"
    >
      {error && <Alert tone="danger">{error}</Alert>}
      <SearchInput
        aria-label="Search eligible orders"
        value={search}
        onChange={setSearch}
        placeholder="Search reference, customer or parcel"
      />
      <div className="mt-4 flex items-center justify-between">
        <Checkbox
          isSelected={
            visible.length > 0 &&
            visible.every((order) => selected.has(order.id))
          }
          onChange={(checked) =>
            visible.forEach((order) => toggle(order.id, checked))
          }
        >
          Select visible orders
        </Checkbox>
        <Badge tone="info">{selected.size} selected</Badge>
      </div>
      <div className="mt-3 max-h-96 space-y-2 overflow-auto">
        {visible.map((order) => (
          <div
            key={order.id}
            className="grid grid-cols-[auto_1fr_auto] gap-3 rounded-xl border border-border p-3"
          >
            <Checkbox
              aria-label={`Select ${order.publicReference}`}
              isSelected={selected.has(order.id)}
              onChange={(checked) => toggle(order.id, checked)}
            />
            <div className="min-w-0 text-sm">
              <p className="font-semibold">
                {order.publicReference} · {order.itemDescription}
              </p>
              <p className="text-muted">
                {order.sender.name} → {order.receiver.name}
              </p>
              <p className="text-muted">
                {order.pickup.city} → {order.delivery.city} ·{" "}
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            {selected.has(order.id) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toggle(order.id, false)}
              >
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>
      <details className="mt-4 rounded-xl border border-border p-3">
        <summary className="cursor-pointer text-sm font-semibold">
          Add by reference
        </summary>
        <p className="mt-2 text-sm text-muted">
          Paste one order reference per line. Using references clears the visual
          selection.
        </p>
        <Textarea
          className="mt-2"
          aria-label="Order references"
          value={references}
          onChange={(event) => {
            setReferences(event.target.value);
            setSelected(new Set());
            setValidation(null);
          }}
          placeholder={"ORD-001\nORD-002"}
        />
      </details>
      {validation && (
        <Alert tone={validation.invalid.length ? "warning" : "success"}>
          {validation.valid.length} ready for batch
          {validation.invalid.length
            ? `; ${validation.invalid.length} unavailable`
            : ""}
          .
        </Alert>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button
          variant="secondary"
          disabled={
            (!selected.size && !references.trim()) || validate.isPending
          }
          onClick={() => validate.mutate()}
        >
          Validate selection
        </Button>
        <Button
          disabled={!validation?.previewToken || create.isPending}
          onClick={() => create.mutate()}
        >
          Confirm and finalize
        </Button>
      </div>
    </Modal>
  );
}
