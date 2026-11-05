import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "../api/client.ts";
import {
  Alert,
  Button,
  FormField,
  Input,
  Modal,
  SearchInput,
  Skeleton,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "../components/ui/index.ts";
import type { CustomerListResponse } from "../features/people/types.ts";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const query = useQuery({
    queryKey: ["customers", search],
    queryFn: () =>
      apiRequest<CustomerListResponse>(
        `/people/customers?search=${encodeURIComponent(search)}`,
      ),
  });
  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-bold">Customers</h2>
          <p className="mt-1 text-sm text-muted">
            Saved contacts available to future order workflows.
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Create customer
        </Button>
      </div>
      <SearchInput
        className="mt-6 w-full max-w-xl"
        value={search}
        onChange={setSearch}
        placeholder="Search customers"
      />
      {query.isLoading ? (
        <Skeleton className="mt-5 h-64" />
      ) : (
        <div className="mt-5 min-w-0">
          <Table>
            <THead>
              <Tr>
                <Th>Name</Th>
                <Th>Phone</Th>
                <Th>Email</Th>
                <Th>Total orders</Th>
                <Th>Created</Th>
              </Tr>
            </THead>
            <TBody>
              {query.data?.items.map((customer) => (
                <Tr key={customer.id}>
                  <Td className="font-semibold">{customer.name}</Td>
                  <Td>{customer.phone}</Td>
                  <Td>{customer.email || "—"}</Td>
                  <Td>{customer.totalOrders}</Td>
                  <Td>{new Date(customer.createdAt).toLocaleDateString()}</Td>
                </Tr>
              ))}
              {!query.data?.items.length && (
                <Tr>
                  <Td colSpan={5}>
                    <p className="py-8 text-center text-muted">
                      No customers found.
                    </p>
                  </Td>
                </Tr>
              )}
            </TBody>
          </Table>
        </div>
      )}
      <Modal
        isOpen={open}
        onOpenChange={setOpen}
        title="Create customer"
        description="Save a customer contact for order creation."
      >
        {error && (
          <Alert className="mb-4" tone="danger">
            {error}
          </Alert>
        )}
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            try {
              await apiRequest("/people/customers", {
                method: "POST",
                body: JSON.stringify({
                  name: data.get("name"),
                  phone: data.get("phone"),
                  email: String(data.get("email") || "").trim() || undefined,
                }),
              });
              setOpen(false);
              setError("");
              await query.refetch();
            } catch (value) {
              setError(
                (value as { message?: string }).message ??
                  "Unable to create customer",
              );
            }
          }}
        >
          <FormField label="Name">
            <Input name="name" required />
          </FormField>
          <FormField label="Phone">
            <Input name="phone" type="tel" required />
          </FormField>
          <FormField label="Email (optional)">
            <Input name="email" type="email" />
          </FormField>
          <Button className="w-full">Create customer</Button>
        </form>
      </Modal>
    </section>
  );
}
