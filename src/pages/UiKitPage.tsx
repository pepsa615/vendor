import { parseDate } from "@internationalized/date";
import { MoreHorizontal, PackageCheck, Plus, Truck } from "lucide-react";
import { useState } from "react";
import {
  Accordion,
  Alert,
  AlertDialog,
  Avatar,
  Badge,
  Button,
  ButtonGroup,
  Calendar,
  Card,
  CardHeader,
  CardTitle,
  Checkbox,
  Chip,
  DateField,
  DatePicker,
  Drawer,
  Dropdown,
  EmptyState,
  FileInput,
  FilterGroup,
  Icon,
  IconLoader,
  ListBox,
  Modal,
  Pagination,
  PasswordInput,
  Pill,
  PinInput,
  Popover,
  SearchInput,
  Select,
  Skeleton,
  SkeletonText,
  StatCard,
  Switch,
  Table,
  Tabs,
  TagGroup,
  TBody,
  Td,
  Th,
  THead,
  Tooltip,
  Tr,
  useToast,
} from "../components/ui/index.ts";

const options = [
  {
    key: "dispatch",
    label: "Dispatch",
    description: "Live delivery operations",
  },
  { key: "manifest", label: "Manifest", description: "Inter-vendor movement" },
  { key: "finance", label: "Finance", description: "Settlement and wallet" },
];
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </Card>
  );
}

export default function UiKitPage() {
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [alertDialog, setAlertDialog] = useState(false);
  const [page, setPage] = useState(1);
  const { show } = useToast();
  return (
    <div className="space-y-6">
      <header>
        <Badge tone="brand">Pepsa UI Kit</Badge>
        <h1 className="mt-3 text-3xl font-bold">
          Reusable interface components
        </h1>
        <p className="mt-2 max-w-3xl text-muted">
          Accessible primitives using the Pepsa red system, consistent sizes,
          semantic states, keyboard behavior, and reduced-motion support.
        </p>
      </header>
      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Buttons and groups">
          <Button size="sm">Small</Button>
          <Button>Primary</Button>
          <Button size="lg" variant="secondary">
            Large
          </Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Saving</Button>
          <ButtonGroup label="View density">
            <Button variant="outline" size="sm">
              Compact
            </Button>
            <Button variant="outline" size="sm">
              Comfortable
            </Button>
          </ButtonGroup>
        </Section>
        <Section title="Status, identity and icons">
          <Badge tone="success" dot>
            Approved
          </Badge>
          <Badge tone="warning">Pending</Badge>
          <Pill tone="info">Information</Pill>
          <Chip selected onRemove={() => undefined}>
            Priority
          </Chip>
          <Avatar name="Ada Nwosu" status="online" />
          <Icon icon={Truck} label="Delivery" size="lg" />
          <IconLoader label="Loading route" />
        </Section>
        <Section title="Inputs and choices">
          <div className="w-full">
            <SearchInput
              aria-label="Search dispatches"
              placeholder="Search tracking ID"
            />
          </div>
          <Switch defaultSelected>Live tracking</Switch>
          <Checkbox defaultSelected>Send notifications</Checkbox>
          <div className="w-full">
            <Select
              label="Workspace"
              options={options}
              defaultSelectedKey="dispatch"
            />
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <PasswordInput aria-label="Password" placeholder="Password" />
            <PinInput
              aria-label="Transaction PIN"
              placeholder="PIN"
              maxLength={6}
            />
          </div>
          <div className="w-full">
            <FileInput aria-label="Upload document" />
          </div>
        </Section>
        <Section title="Metrics, filters and empty states">
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <StatCard label="Active dispatches" value="24" tone="brand" />
            <StatCard label="Online dispatchers" value="8" tone="success" />
          </div>
          <FilterGroup
            label="Show only:"
            value="active"
            onChange={() => undefined}
            options={[
              { value: "all", label: "All", count: 32 },
              { value: "active", label: "Active", count: 24, tone: "brand" },
              { value: "done", label: "Completed", count: 8, tone: "success" },
            ]}
          />
          <div className="w-full rounded-xl border border-border">
            <EmptyState
              title="No records yet"
              description="New activity will appear here."
            />
          </div>
        </Section>
        <Section title="Menus and collections">
          <Dropdown
            label="Actions"
            items={[
              ...options,
              { key: "delete", label: "Delete", danger: true },
            ]}
            onAction={() => undefined}
          />
          <div className="w-full">
            <ListBox
              aria-label="Operational modules"
              options={options}
              selectionMode="single"
              defaultSelectedKeys={["dispatch"]}
            />
          </div>
          <div className="w-full">
            <TagGroup
              label="Filters"
              items={[
                { key: "active", label: "Active" },
                { key: "today", label: "Today" },
              ]}
              onRemove={() => undefined}
            />
          </div>
        </Section>
        <Section title="Navigation and disclosure">
          <div className="w-full">
            <Tabs
              defaultSelectedKey="dispatch"
              items={options.map((option) => ({
                key: String(option.key),
                label: option.label,
                content: (
                  <p className="text-sm text-muted">{option.description}</p>
                ),
              }))}
            />
          </div>
          <div className="w-full">
            <Accordion
              items={[
                {
                  key: "one",
                  title: "What is a runway manifest?",
                  content:
                    "A vendor-owned fleet assignment for one pickup and one or more delivery stops.",
                },
                {
                  key: "two",
                  title: "Where do settlements go?",
                  content:
                    "Earnings enter the settlement ledger before an explicit cash-out to wallet.",
                },
              ]}
            />
          </div>
        </Section>
        <Section title="Dates">
          <Calendar
            aria-label="Delivery date"
            defaultValue={parseDate("2026-10-16")}
          />
          <div className="grid flex-1 gap-4">
            <DateField
              label="Manifest date"
              defaultValue={parseDate("2026-10-16")}
            />
            <DatePicker
              label="Pickup date"
              defaultValue={parseDate("2026-10-16")}
            />
          </div>
        </Section>
        <Section title="Feedback">
          <div className="w-full space-y-3">
            <Alert tone="success" title="Manifest accepted">
              The receiving vendor has been notified.
            </Alert>
            <Alert tone="warning" title="Wallet running low">
              Add funds before using general-pool dispatch.
            </Alert>
            <Skeleton className="h-12 w-full" />
            <SkeletonText />
          </div>
        </Section>
        <Section title="Overlays">
          <Button onClick={() => setModal(true)}>Open modal</Button>
          <Button variant="outline" onClick={() => setDrawer(true)}>
            Open drawer
          </Button>
          <Button variant="danger" onClick={() => setAlertDialog(true)}>
            Alert dialog
          </Button>
          <Popover
            trigger={
              <span className="rounded-lg border border-border px-3 py-2 text-sm font-semibold">
                Popover
              </span>
            }
          >
            Contextual content stays close to its trigger.
          </Popover>
          <Tooltip content="More actions">
            <span className="grid size-10 place-items-center rounded-lg border border-border">
              <MoreHorizontal className="size-4" />
            </span>
          </Tooltip>
          <Button
            variant="outline"
            onClick={() =>
              show({
                title: "Order paired",
                description: "A dispatcher accepted the assignment.",
                tone: "success",
              })
            }
          >
            Show toast
          </Button>
        </Section>
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Data table</CardTitle>
            <Button size="sm">
              <Plus className="size-4" />
              Create dispatch
            </Button>
          </CardHeader>
          <Table>
            <THead>
              <Tr>
                <Th>Tracking ID</Th>
                <Th>Dispatcher</Th>
                <Th>Status</Th>
                <Th>Amount</Th>
              </Tr>
            </THead>
            <TBody>
              <Tr>
                <Td>PEP-10482</Td>
                <Td>
                  <span className="flex items-center gap-2">
                    <Avatar name="Tunde Bello" size="sm" />
                    Tunde Bello
                  </span>
                </Td>
                <Td>
                  <Badge tone="success">Paired</Badge>
                </Td>
                <Td>₦12,500.00</Td>
              </Tr>
              <Tr>
                <Td>PEP-10483</Td>
                <Td>Unassigned</Td>
                <Td>
                  <Badge tone="warning">Pending</Badge>
                </Td>
                <Td>₦8,200.00</Td>
              </Tr>
            </TBody>
          </Table>
          <div className="flex justify-end border-t border-border p-4">
            <Pagination
              page={page}
              pageSize={10}
              total={42}
              onPageChange={setPage}
            />
          </div>
        </Card>
      </div>
      <Modal
        isOpen={modal}
        onOpenChange={setModal}
        title="Create manifest"
        description="Review the selected shipments before continuing."
        footer={<Button onClick={() => setModal(false)}>Continue</Button>}
      >
        <p className="text-sm text-muted">
          Modal content uses a trapped focus scope, escape handling, and an
          accessible title.
        </p>
      </Modal>
      <Drawer isOpen={drawer} onOpenChange={setDrawer} title="Shipment details">
        <div className="grid place-items-center rounded-xl bg-neutral-50 p-8 text-center">
          <PackageCheck className="size-10 text-brand-600" />
          <p className="mt-3 font-semibold">Shipment ready</p>
        </div>
      </Drawer>
      <AlertDialog
        isOpen={alertDialog}
        onOpenChange={setAlertDialog}
        title="Cancel dispatch?"
        description="The dispatcher will be notified immediately."
        confirmLabel="Cancel dispatch"
        onConfirm={() => setAlertDialog(false)}
      />
    </div>
  );
}
