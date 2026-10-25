import { parseDate, type DateValue } from "@internationalized/date";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LockKeyhole, X } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../api/client.ts";
import { AuthShell, StepProgress } from "../components/shared/AuthShell.tsx";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  FileInput,
  FormField,
  Input,
  Select,
} from "../components/ui/index.ts";
import { useSession } from "../contexts/SessionContext.tsx";
import { NIGERIA_STATE_OPTIONS } from "../constants/nigeriaStates.ts";

const GENDER_OPTIONS = [
  { key: "MALE", label: "Male" },
  { key: "FEMALE", label: "Female" },
  { key: "OTHER", label: "Other" },
] as const;
const COMPANY_TYPE_OPTIONS = [
  { key: "BUSINESS_NAME", label: "Business Name" },
  { key: "SOLE_PROPRIETOR", label: "Sole Proprietor" },
  { key: "LIMITED_LIABILITY", label: "Limited Liability" },
  { key: "UNLIMITED_LIABILITY", label: "Unlimited Liability" },
  { key: "PUBLIC_LIMITED_COMPANY", label: "Public Limited Company (PLC)" },
  { key: "NON_PROFIT", label: "Non-Profit" },
] as const;

function toDateValue(value?: string): DateValue | null {
  if (!value) return null;
  const iso = value.includes("T") ? value.slice(0, 10) : value;
  try {
    return parseDate(iso);
  } catch {
    return null;
  }
}

function fromDateValue(value: DateValue | null): string {
  return value ? value.toString() : "";
}

type Director = {
  id?: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  identityNumber: string;
  phone: string;
  homeAddress: string;
  state: string;
  city: string;
  role: string;
  ownershipShare: number;
};
type Application = {
  id: string;
  status: string;
  personalData?: Record<string, string>;
  businessData?: Record<string, string>;
  directors: Array<Director & { id: string }>;
  documents: Array<{
    id: string;
    documentType: string;
    ownerId?: string;
    originalName: string;
    status: string;
  }>;
  correctionFields: string[];
};
const personalFields = [
  ["firstName", "First Name"],
  ["lastName", "Last Name"],
  ["gender", "Gender"],
  ["dateOfBirth", "Date of birth"],
  ["identityNumber", "NIN / Identity number"],
  ["phone", "Personal Phone Number"],
  ["homeAddress", "Home address"],
  ["state", "State"],
  ["city", "City"],
] as const;
const businessFields = [
  ["legalName", "Business Legal Name"],
  ["registrationType", "Registration type"],
  ["registrationDate", "Registration date"],
  ["registrationNumber", "Registration number"],
  ["taxNumber", "Tax number"],
  ["registeredAddress", "Registered address"],
  ["businessAddress", "Business address"],
  ["state", "State"],
  ["city", "City"],
] as const;
export default function OnboardingPage() {
  const { session, reload } = useSession();
  const { step = "details" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [error, setError] = useState("");
  const query = useQuery({
    queryKey: ["onboarding"],
    queryFn: () => apiRequest<Application>("/onboarding/application"),
    enabled: Boolean(session),
  });
  const save = useMutation({
    mutationFn: ({ path, body }: { path: string; body: unknown }) =>
      apiRequest(`/onboarding/${path}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["onboarding"] });
      setError("");
    },
  });
  if (!session) return <Navigate to="/login" replace />;
  if (session.vendor.status === "APPROVED")
    return <Navigate to="/dashboard" replace />;
  if (session.vendor.status === "UNDER_REVIEW")
    return <Navigate to="/review-status" replace />;
  if (query.isLoading)
    return (
      <AuthShell contentClassName="max-w-2xl">
        <p className="text-sm text-muted">Loading application…</p>
      </AuthShell>
    );
  if (query.error)
    return (
      <AuthShell contentClassName="max-w-2xl">
        <Alert tone="danger">Unable to load onboarding.</Alert>
      </AuthShell>
    );
  const app = query.data!;
  const company = session.vendor.type === "COMPANY";
  const totalSteps = company ? 5 : 4;
  const currentStep =
    step === "details" ? 3 : step === "directors" ? 4 : totalSteps;
  return (
    <AuthShell contentClassName="max-w-2xl">
      <StepProgress current={currentStep} total={totalSteps} />
      <div className="flex items-center gap-3 rounded-md bg-[#eef0f3] px-4 py-3 text-xs text-neutral-700">
        <LockKeyhole className="size-4 shrink-0 text-neutral-400" />
        <span className="flex-1">
          You can be sure that your personal data is securely protected.
        </span>
        <X className="size-4 text-neutral-400" aria-hidden />
      </div>
      {app.status === "REJECTED" && (
        <Alert className="mt-4" tone="warning" title="Corrections requested">
          Update the flagged sections: {app.correctionFields.join(", ")}
        </Alert>
      )}
      {error && (
        <Alert className="mt-4" tone="danger">
          {error}
        </Alert>
      )}
      {step === "details" && (
        <DetailsForm
          company={company}
          data={(company ? app.businessData : app.personalData) ?? {}}
          loading={save.isPending}
          onSubmit={async (body) => {
            try {
              await save.mutateAsync({
                path: company ? "business" : "personal",
                body,
              });
              navigate(
                company ? "/onboarding/directors" : "/onboarding/documents",
              );
            } catch (value) {
              setError(
                (value as { message?: string }).message ?? "Unable to save",
              );
            }
          }}
        />
      )}
      {step === "directors" && company && (
        <DirectorsForm
          initial={app.directors}
          loading={save.isPending}
          onSubmit={async (directors) => {
            try {
              await save.mutateAsync({
                path: "directors",
                body: { directors },
              });
              navigate("/onboarding/documents");
            } catch (value) {
              setError(
                (value as { message?: string }).message ??
                  "Unable to save directors",
              );
            }
          }}
        />
      )}
      {step === "documents" && (
        <DocumentsForm
          company={company}
          application={app}
          onComplete={async () => {
            await reload();
            navigate("/thank-you");
          }}
        />
      )}
    </AuthShell>
  );
}
function DetailsForm({
  company,
  data,
  loading,
  onSubmit,
}: {
  company: boolean;
  data: Record<string, string>;
  loading: boolean;
  onSubmit: (body: Record<string, string>) => void;
}) {
  const fields = company ? businessFields : personalFields;
  const [gender, setGender] = useState(data.gender || "MALE");
  const [dateOfBirth, setDateOfBirth] = useState<DateValue | null>(
    toDateValue(data.dateOfBirth),
  );
  const [registrationType, setRegistrationType] = useState(
    data.registrationType || undefined,
  );
  const [registrationDate, setRegistrationDate] = useState<DateValue | null>(
    toDateValue(data.registrationDate),
  );
  const [state, setState] = useState(data.state || undefined);
  return (
    <>
      <h1 className="text-[2rem] font-bold leading-tight">
        {company ? "Business Data" : "Personal Data"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        Fill in the data required for {company ? "KYB" : "KYC"} verification.
      </p>
      <form
        className="mt-5 grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const body = Object.fromEntries(
            new FormData(event.currentTarget),
          ) as Record<string, string>;
          onSubmit(
            company
              ? {
                  ...body,
                  registrationType: registrationType ?? "",
                  registrationDate: fromDateValue(registrationDate),
                  state: state ?? "",
                }
              : {
                  ...body,
                  gender,
                  dateOfBirth: fromDateValue(dateOfBirth),
                  state: state ?? "",
                },
          );
        }}
      >
        {fields.map(([name, label]) => (
          <div
            key={name}
            className={
              [
                "legalName",
                "registeredAddress",
                "businessAddress",
                "firstName",
                "lastName",
                "identityNumber",
                "phone",
                "homeAddress",
              ].includes(name)
                ? "sm:col-span-2"
                : ""
            }
          >
            {name === "state" ? (
              <Select
                label={label}
                placeholder="Select state"
                selectedKey={state}
                onSelectionChange={(key) => setState(String(key))}
                isRequired
                options={NIGERIA_STATE_OPTIONS}
              />
            ) : name === "registrationType" ? (
              <Select
                label={label}
                placeholder="Select company type"
                selectedKey={registrationType}
                onSelectionChange={(key) => setRegistrationType(String(key))}
                isRequired
                options={[...COMPANY_TYPE_OPTIONS]}
              />
            ) : name === "registrationDate" ? (
              <DatePicker
                label={label}
                value={registrationDate}
                onChange={setRegistrationDate}
                isRequired
              />
            ) : name === "gender" ? (
              <Select
                label={label}
                selectedKey={gender}
                onSelectionChange={(key) => setGender(String(key))}
                isRequired
                options={[...GENDER_OPTIONS]}
              />
            ) : name === "dateOfBirth" ? (
              <DatePicker
                label={label}
                value={dateOfBirth}
                onChange={setDateOfBirth}
                isRequired
              />
            ) : (
              <FormField label={label}>
                <Input
                  name={name}
                  type={name.toLowerCase().includes("date") ? "date" : "text"}
                  defaultValue={
                    data[name]?.includes("T")
                      ? data[name].slice(0, 10)
                      : (data[name] ?? "")
                  }
                  required
                />
              </FormField>
            )}
          </div>
        ))}
        <Button
          className="mx-auto mt-5 w-72 sm:col-span-2 sm:w-72"
          loading={loading}
        >
          Continue
        </Button>
      </form>
    </>
  );
}
function emptyDirector(): Director {
  return {
    firstName: "",
    lastName: "",
    gender: "MALE",
    dateOfBirth: "",
    identityNumber: "",
    phone: "",
    homeAddress: "",
    state: "",
    city: "",
    role: "Director",
    ownershipShare: 100,
  };
}
function DirectorsForm({
  initial,
  loading,
  onSubmit,
}: {
  initial: Array<Director & { id: string }>;
  loading: boolean;
  onSubmit: (value: Director[]) => void;
}) {
  const [items, setItems] = useState<Director[]>(
    initial.length
      ? initial.map(
          (item) =>
            ({
              ...item,
              dateOfBirth: item.dateOfBirth?.slice(0, 10),
              identityNumber: "",
            }) as Director,
        )
      : [emptyDirector()],
  );
  return (
    <>
      <h1 className="text-[2rem] font-bold leading-tight">
        Director’s Information
      </h1>
      <p className="mt-2 text-sm text-muted">
        Add every beneficial owner or director.
      </p>
      <form
        className="mt-5 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          onSubmit(
            items.map((item, i) => ({
              firstName: String(data.get(`${i}.firstName`)),
              lastName: String(data.get(`${i}.lastName`)),
              gender: item.gender || "MALE",
              dateOfBirth: item.dateOfBirth,
              identityNumber: String(data.get(`${i}.identityNumber`)),
              phone: String(data.get(`${i}.phone`)),
              homeAddress: String(data.get(`${i}.homeAddress`)),
              state: item.state,
              city: String(data.get(`${i}.city`)),
              role: String(data.get(`${i}.role`)),
              ownershipShare: Number(data.get(`${i}.ownershipShare`)),
            })),
          );
        }}
      >
        {items.map((item, i) => (
          <Card key={i}>
            <h2 className="mb-4 font-semibold">Director {i + 1}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {personalFields.map(([name, label]) =>
                name === "state" ? (
                  <Select
                    key={name}
                    label={label}
                    placeholder="Select state"
                    selectedKey={item.state || undefined}
                    onSelectionChange={(key) =>
                      setItems((current) =>
                        current.map((director, index) =>
                          index === i
                            ? { ...director, state: String(key) }
                            : director,
                        ),
                      )
                    }
                    isRequired
                    options={NIGERIA_STATE_OPTIONS}
                  />
                ) : name === "gender" ? (
                  <Select
                    key={name}
                    label={label}
                    selectedKey={item.gender || "MALE"}
                    onSelectionChange={(key) =>
                      setItems((current) =>
                        current.map((director, index) =>
                          index === i
                            ? { ...director, gender: String(key) }
                            : director,
                        ),
                      )
                    }
                    isRequired
                    options={[...GENDER_OPTIONS]}
                  />
                ) : name === "dateOfBirth" ? (
                  <DatePicker
                    key={name}
                    label={label}
                    value={toDateValue(item.dateOfBirth)}
                    onChange={(value) =>
                      setItems((current) =>
                        current.map((director, index) =>
                          index === i
                            ? {
                                ...director,
                                dateOfBirth: fromDateValue(value),
                              }
                            : director,
                        ),
                      )
                    }
                    isRequired
                  />
                ) : (
                  <FormField key={name} label={label}>
                    <Input
                      name={`${i}.${name}`}
                      type="text"
                      defaultValue={String(item[name as keyof Director] ?? "")}
                      required
                    />
                  </FormField>
                ),
              )}
              <FormField label="Role">
                <Input name={`${i}.role`} defaultValue={item.role} required />
              </FormField>
              <FormField label="Ownership share %">
                <Input
                  name={`${i}.ownershipShare`}
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  defaultValue={item.ownershipShare}
                  required
                />
              </FormField>
            </div>
          </Card>
        ))}
        <Button
          variant="ghost"
          type="button"
          className="justify-start px-0 text-sm font-semibold text-brand"
          onClick={() => setItems((current) => [...current, emptyDirector()])}
        >
          ＋ Add more Directors
        </Button>
        <Button className="mx-auto mt-5 w-72" loading={loading}>
          Continue
        </Button>
      </form>
    </>
  );
}
function DocumentsForm({
  company,
  application,
  onComplete,
}: {
  company: boolean;
  application: Application;
  onComplete: () => void;
}) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const base = company
    ? [
        ["BUSINESS_CERTIFICATE", "Business Certificate"],
        ["MEMART_CERTIFICATE", "Memart Certificate"],
        ["STATUS_REPORT", "Status Report"],
        ["PROOF_OF_BUSINESS_ADDRESS", "Proof of Business Address"],
      ]
    : [
        ["PROOF_OF_ID", "Proof of ID"],
        ["PROOF_OF_ADDRESS", "Proof of Address: Utility Bill"],
        ["HEADSHOT", "Passport: Headshot"],
      ];
  const upload = async (
    type: string,
    file: File,
    ownerType: string,
    ownerId?: string,
  ) => {
    setBusy(`${ownerId ?? "base"}:${type}`);
    setError("");
    const body = new FormData();
    body.set("file", file);
    body.set("documentType", type);
    body.set("ownerType", ownerType);
    if (ownerId) body.set("ownerId", ownerId);
    try {
      await apiRequest("/onboarding/documents", { method: "POST", body });
    } catch (value) {
      setError((value as { message?: string }).message ?? "Upload failed");
    } finally {
      setBusy("");
    }
  };
  return (
    <>
      <h1 className="text-[2rem] font-bold leading-tight">Upload Documents</h1>
      <p className="mt-2 text-sm text-muted">
        Files must be JPG, PNG or PDF and no larger than 15 MB.
      </p>
      {error && (
        <Alert className="mt-4" tone="danger">
          {error}
        </Alert>
      )}
      <div className="mt-5 space-y-5">
        <DocumentGroup
          title={company ? "Business Documents" : "Personal Documents"}
          fields={base}
          ownerType={company ? "BUSINESS" : "INDIVIDUAL"}
          busy={busy}
          upload={upload}
        />
        {company &&
          application.directors.map((d) => (
            <DocumentGroup
              key={d.id}
              title={`${d.firstName} ${d.lastName} — Director Documents`}
              fields={[
                ["PROOF_OF_ID", "Proof of ID"],
                ["PROOF_OF_ADDRESS", "Proof of Address"],
                ["HEADSHOT", "Passport: Headshot"],
              ]}
              ownerType="DIRECTOR"
              ownerId={d.id}
              busy={busy}
              upload={upload}
            />
          ))}
      </div>
      <Button
        className="mx-auto mt-5 w-72"
        loading={busy === "submit"}
        onClick={async () => {
          setBusy("submit");
          try {
            await apiRequest("/onboarding/submit", { method: "POST" });
            onComplete();
          } catch (value) {
            setError(
              (value as { message?: string }).message ?? "Submission failed",
            );
            setBusy("");
          }
        }}
      >
        Submit
      </Button>
    </>
  );
}
function DocumentGroup({
  title,
  fields,
  ownerType,
  ownerId,
  busy,
  upload,
}: {
  title: string;
  fields: string[][];
  ownerType: string;
  ownerId?: string;
  busy: string;
  upload: (
    type: string,
    file: File,
    ownerType: string,
    ownerId?: string,
  ) => void;
}) {
  return (
    <Card>
      <h2 className="mb-4 font-semibold underline">{title}</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map(([type, label]) => (
          <FormField key={type} label={label}>
            <FileInput
              accept=".jpg,.jpeg,.png,.pdf"
              disabled={Boolean(busy)}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(type, file, ownerType, ownerId);
              }}
            />
          </FormField>
        ))}
      </div>
    </Card>
  );
}
