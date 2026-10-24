import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  UserRoundCheck,
  UserRoundMinus,
  UsersRound,
  Wifi,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { apiRequest } from "../api/client.ts";
import {
  Alert,
  Badge,
  Card,
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
import type {
  DispatcherListItem,
  DispatcherListResponse,
  DispatcherStatus,
} from "../features/people/types.ts";

const tone = (status: DispatcherStatus) =>
  status === "APPROVED"
    ? "success"
    : status === "REJECTED" || status === "DISABLED"
      ? "danger"
      : status === "UNDER_REVIEW"
        ? "warning"
        : "neutral";

export default function DispatchersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const query = useQuery({
    queryKey: ["dispatchers", search, status],
    queryFn: () =>
      apiRequest<DispatcherListResponse>(
        `/people/dispatchers?search=${encodeURIComponent(search)}&status=${status}`,
      ),
  });
  const stats = query.data?.stats;
  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Dispatchers</h2>
          <p className="mt-1 text-sm text-muted">
            Onboard your fleet and monitor Pepsa compliance approval.
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand bg-brand px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          to="/people/dispatchers/new"
        >
          <Plus className="size-4" /> Add dispatcher
        </Link>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            ["Online", stats?.online ?? 0, Wifi],
            ["Active", stats?.active ?? 0, UserRoundCheck],
            ["Inactive", stats?.inactive ?? 0, UserRoundMinus],
            ["Total", stats?.total ?? 0, UsersRound],
          ] satisfies Array<[string, number, LucideIcon]>
        ).map(([label, value, Icon]) => (
          <Card key={String(label)} size="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">{String(label)}</p>
                <p className="mt-1 text-2xl font-bold">{String(value)}</p>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand">
                <Icon className="size-5" />
              </span>
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          className="flex-1"
          value={search}
          onChange={setSearch}
          placeholder="Search name, phone, or email"
        />
        <Select
          className="sm:w-56"
          label="Approval status"
          selectedKey={status}
          onSelectionChange={(key) => setStatus(String(key))}
          options={[
            "ALL",
            "DRAFT",
            "UNDER_REVIEW",
            "APPROVED",
            "REJECTED",
            "DISABLED",
          ].map((key) => ({ key, label: key.replaceAll("_", " ") }))}
        />
      </div>
      {query.isError && (
        <Alert className="mt-5" tone="danger">
          Unable to load dispatchers.
        </Alert>
      )}
      {query.isLoading ? (
        <Skeleton className="mt-5 h-72" />
      ) : (
        <div className="mt-5 overflow-x-auto">
          <Table>
            <THead>
              <Tr>
                <Th>Name</Th>
                <Th>Registered</Th>
                <Th>Vehicle</Th>
                <Th>Deployment</Th>
                <Th>Contact</Th>
                <Th>Revenue share</Th>
                <Th>Orders</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </Tr>
            </THead>
            <TBody>
              {query.data?.items.map((dispatcher: DispatcherListItem) => (
                <Tr key={dispatcher.id}>
                  <Td>
                    <span className="font-semibold">
                      {dispatcher.firstName} {dispatcher.lastName}
                    </span>
                    {dispatcher.pendingRevisionStatus && (
                      <span className="block text-xs text-warning-700">
                        Changes{" "}
                        {dispatcher.pendingRevisionStatus
                          .toLowerCase()
                          .replaceAll("_", " ")}
                      </span>
                    )}
                  </Td>
                  <Td>{new Date(dispatcher.createdAt).toLocaleDateString()}</Td>
                  <Td>
                    {dispatcher.vehicleType.replaceAll("_", " ")}
                    <span className="block text-xs text-muted">
                      {dispatcher.vehicleBrand || dispatcher.plateNumber || "—"}
                    </span>
                  </Td>
                  <Td>
                    {dispatcher.state}, {dispatcher.city}
                  </Td>
                  <Td>
                    {dispatcher.phone}
                    <span className="block text-xs text-muted">
                      {dispatcher.email}
                    </span>
                  </Td>
                  <Td>{dispatcher.revenueSharePct}%</Td>
                  <Td>{dispatcher.totalOrdersPicked}</Td>
                  <Td>
                    <Badge tone={tone(dispatcher.status)} dot>
                      {dispatcher.availability
                        ? "ONLINE"
                        : dispatcher.status.replaceAll("_", " ")}
                    </Badge>
                  </Td>
                  <Td>
                    <Link
                      className="font-semibold text-brand hover:underline"
                      to={`/people/dispatchers/${dispatcher.id}`}
                    >
                      View details
                    </Link>
                  </Td>
                </Tr>
              ))}
              {!query.data?.items.length && (
                <Tr>
                  <Td colSpan={9}>
                    <p className="py-8 text-center text-muted">
                      No dispatchers found.
                    </p>
                  </Td>
                </Tr>
              )}
            </TBody>
          </Table>
        </div>
      )}
    </section>
  );
}
