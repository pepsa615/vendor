import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "../api/client.ts";
import {
  Alert,
  Button,
  Card,
  FormField,
  Input,
  Select,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "../components/ui/index.ts";
type Role = { id: string; name: string; isOwner: boolean };
type Staff = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: string;
  roleAssignments: Array<{ role: Role }>;
};
export default function StaffPage() {
  const staff = useQuery({
    queryKey: ["staff"],
    queryFn: () => apiRequest<Staff[]>("/staff"),
  });
  const roles = useQuery({
    queryKey: ["roles"],
    queryFn: () => apiRequest<Role[]>("/roles"),
  });
  const [roleId, setRoleId] = useState<string>("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  return (
    <div>
      <h1 className="text-3xl font-bold">Staff</h1>
      <p className="mt-2 text-muted">
        Invite teammates and control their access.
      </p>
      {error && (
        <Alert className="mt-5" tone="danger">
          {error}
        </Alert>
      )}
      {message && (
        <Alert className="mt-5" tone="success">
          {message}
        </Alert>
      )}
      <Card className="mt-6">
        <form
          className="flex flex-wrap items-end gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            try {
              await apiRequest("/staff/invitations", {
                method: "POST",
                body: JSON.stringify({ email: data.get("email"), roleId }),
              });
              setMessage("Invitation queued for delivery.");
              form.reset();
              setRoleId("");
            } catch (value) {
              setError(
                (value as { message?: string }).message ?? "Invite failed",
              );
            }
          }}
        >
          <div className="min-w-64 flex-1">
            <FormField label="Staff email">
              <Input name="email" type="email" required />
            </FormField>
          </div>
          <Select
            className="min-w-56"
            label="Role"
            selectedKey={roleId || null}
            onSelectionChange={(key) => setRoleId(String(key))}
            options={(roles.data ?? [])
              .filter((role) => !role.isOwner)
              .map((role) => ({ key: role.id, label: role.name }))}
          />
          <Button disabled={!roleId}>Send invitation</Button>
        </form>
      </Card>
      <div className="mt-6">
        <Table>
          <THead>
            <Tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Action</Th>
            </Tr>
          </THead>
          <TBody>
            {staff.data?.map((user) => (
              <Tr key={user.id}>
                <Td>
                  {user.firstName} {user.lastName}
                </Td>
                <Td>{user.email}</Td>
                <Td>
                  {user.roleAssignments.map(({ role }) => role.name).join(", ")}
                </Td>
                <Td>{user.status}</Td>
                <Td>
                  {!user.roleAssignments.some(({ role }) => role.isOwner) &&
                    user.status !== "DISABLED" && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={async () => {
                          await apiRequest(`/staff/${user.id}/disable`, {
                            method: "PATCH",
                          });
                          await staff.refetch();
                        }}
                      >
                        Disable
                      </Button>
                    )}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
