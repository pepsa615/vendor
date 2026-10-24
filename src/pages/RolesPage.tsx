import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "../api/client.ts";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  FormField,
  Input,
} from "../components/ui/index.ts";
const catalogue = [
  "vendor.profile.read",
  "vendor.profile.manage",
  "staff.read",
  "staff.manage",
  "roles.read",
  "roles.manage",
  "audit.read",
  "dashboard.read",
  "operations.read",
  "operations.manage",
  "manifests.read",
  "manifests.manage",
  "dispatch.read",
  "dispatch.manage",
  "people.dispatchers.read",
  "people.dispatchers.manage",
  "people.customers.read",
  "people.customers.manage",
  "settlement.read",
  "wallet.read",
  "wallet.manage",
  "payment-settings.read",
  "payment-settings.manage",
];
type Role = {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isOwner: boolean;
};
export default function RolesPage() {
  const query = useQuery({
    queryKey: ["roles"],
    queryFn: () => apiRequest<Role[]>("/roles"),
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  return (
    <div>
      <h1 className="text-3xl font-bold">Staff Roles</h1>
      <p className="mt-2 text-muted">
        Create least-privilege roles for your team.
      </p>
      {error && (
        <Alert className="mt-5" tone="danger">
          {error}
        </Alert>
      )}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Card>
          <h2 className="text-lg font-semibold">Create custom role</h2>
          <form
            className="mt-5 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const data = new FormData(form);
              try {
                await apiRequest("/roles", {
                  method: "POST",
                  body: JSON.stringify({
                    name: data.get("name"),
                    description: data.get("description"),
                    permissions: selected,
                  }),
                });
                setSelected([]);
                form.reset();
                await query.refetch();
              } catch (value) {
                setError(
                  (value as { message?: string }).message ??
                    "Unable to create role",
                );
              }
            }}
          >
            <FormField label="Role name">
              <Input name="name" required />
            </FormField>
            <FormField label="Description">
              <Input name="description" />
            </FormField>
            <fieldset className="grid gap-3">
              <legend className="mb-3 font-medium">Permissions</legend>
              {catalogue.map((permission) => (
                <Checkbox
                  key={permission}
                  isSelected={selected.includes(permission)}
                  onChange={(checked) =>
                    setSelected((values) =>
                      checked
                        ? [...values, permission]
                        : values.filter((value) => value !== permission),
                    )
                  }
                >
                  {permission}
                </Checkbox>
              ))}
            </fieldset>
            <Button className="w-full">Create role</Button>
          </form>
        </Card>
        <section>
          <h2 className="mb-4 text-lg font-semibold">Current roles</h2>
          <div className="space-y-3">
            {query.data?.map((role) => (
              <Card key={role.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {role.name}
                      {role.isOwner && (
                        <span className="ml-2 text-xs text-brand">
                          Protected
                        </span>
                      )}
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      {role.description ||
                        `${role.permissions.length} permissions`}
                    </p>
                  </div>
                  {!role.isOwner && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={async () => {
                        await apiRequest(`/roles/${role.id}`, {
                          method: "DELETE",
                        });
                        await query.refetch();
                      }}
                    >
                      Delete
                    </Button>
                  )}
                </div>
                <p className="mt-3 text-xs text-muted">
                  {role.permissions.join(", ")}
                </p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
