import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client.ts";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  DatePicker,
  FileInput,
  FormField,
  Input,
  Select,
} from "../components/ui/index.ts";
import type { DispatcherDetail } from "../features/people/types.ts";
import { NIGERIA_STATE_OPTIONS } from "../constants/nigeriaStates.ts";

const vehicles = [
  "FOOT",
  "BICYCLE",
  "MOTORCYCLE",
  "TRICYCLE",
  "VAN",
  "TRUCK",
  "LONG_TRUCK",
];
const motorized = new Set([
  "MOTORCYCLE",
  "TRICYCLE",
  "VAN",
  "TRUCK",
  "LONG_TRUCK",
]);
const documentFields = [
  ["PROOF_OF_ID", "Proof of identity", true],
  ["HEADSHOT", "Headshot", true],
  ["PROOF_OF_ADDRESS", "Proof of address", true],
  ["DRIVERS_LICENSE", "Driver's license", false],
  ["INSURANCE", "Insurance", false],
  ["ROADWORTHINESS_CERTIFICATE", "Roadworthiness certificate", false],
  ["PROOF_OF_OWNERSHIP", "Proof of ownership", false],
  ["VEHICLE_REGISTRATION", "Vehicle registration document", false],
  ["PARKING_PERMIT", "Parking permit", false],
] as const;

export default function DispatcherFormPage() {
  const navigate = useNavigate();
  const [vehicleType, setVehicleType] = useState("MOTORCYCLE");
  const [engagementType, setEngagementType] = useState("STAFF");
  const [gender, setGender] = useState("MALE");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  return (
    <section>
      <div>
        <h2 className="text-xl font-bold">Add dispatcher</h2>
        <p className="mt-1 text-sm text-muted">
          Complete the profile and compliance documents for Pepsa review.
        </p>
      </div>
      {error && (
        <Alert className="mt-5" tone="danger">
          {error}
        </Alert>
      )}
      <form
        className="mt-6 space-y-6"
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);
          setError("");
          const form = event.currentTarget;
          const data = new FormData(form);
          const optional = (name: string) =>
            String(data.get(name) || "").trim() || undefined;
          try {
            const dispatcher = await apiRequest<DispatcherDetail>(
              "/people/dispatchers",
              {
                method: "POST",
                body: JSON.stringify({
                  firstName: data.get("firstName"),
                  lastName: data.get("lastName"),
                  email: data.get("email"),
                  phone: data.get("phone"),
                  dateOfBirth: data.get("dateOfBirth"),
                  gender,
                  identityType: "NIN",
                  identityNumber: data.get("nin"),
                  homeAddress: data.get("homeAddress"),
                  state: data.get("state"),
                  city: data.get("city"),
                  termsAccepted,
                  engagementType,
                  vehicleType,
                  vehicleBrand: optional("vehicleBrand"),
                  plateNumber: optional("plateNumber"),
                  vehicleRegistrationDate: data.get("vehicleRegistrationDate"),
                  guarantorName: data.get("guarantorName"),
                  guarantorPhone: data.get("guarantorPhone"),
                  guarantorEmail: optional("guarantorEmail"),
                  guarantorAddress: optional("guarantorAddress"),
                  revenueSharePct: Number(data.get("revenueSharePct")),
                }),
              },
            );
            for (const [type] of documentFields) {
              const file = data.get(`document-${type}`);
              if (file instanceof File && file.size) {
                const upload = new FormData();
                upload.set("documentType", type);
                upload.set("file", file);
                await apiRequest(
                  `/people/dispatchers/${dispatcher.id}/documents`,
                  { method: "POST", body: upload },
                );
              }
            }
            await apiRequest(`/people/dispatchers/${dispatcher.id}/submit`, {
              method: "POST",
            });
            navigate(`/people/dispatchers/${dispatcher.id}`);
          } catch (value) {
            setError(
              (value as { message?: string }).message ??
                "Unable to register dispatcher",
            );
          } finally {
            setLoading(false);
          }
        }}
      >
        <Card>
          <h3 className="text-lg font-semibold">Personal information</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="First name" name="firstName" />
            <Field label="Last name" name="lastName" />
            <Field label="Email" name="email" type="email" />
            <Field label="Phone" name="phone" type="tel" />
            <DatePicker label="Date of birth" name="dateOfBirth" isRequired />
            <Select
              label="Gender"
              selectedKey={gender}
              onSelectionChange={(key) => setGender(String(key))}
              options={["MALE", "FEMALE", "OTHER"].map((key) => ({
                key,
                label: key,
              }))}
            />
            <Field
              label="National Identification Number (NIN)"
              name="nin"
              inputMode="numeric"
              pattern="[0-9]{11}"
              minLength={11}
              maxLength={11}
              placeholder="11-digit NIN"
            />
            <Field label="Home address" name="homeAddress" />
            <Select
              label="State"
              name="state"
              placeholder="Select state"
              options={NIGERIA_STATE_OPTIONS}
            />
            <Field label="City" name="city" />
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold">Engagement and mobility</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Select
              label="Engagement type"
              selectedKey={engagementType}
              onSelectionChange={(key) => setEngagementType(String(key))}
              options={["STAFF", "FREELANCER", "CONTRACTOR"].map((key) => ({
                key,
                label: key,
              }))}
            />
            <Select
              label="Vehicle type"
              selectedKey={vehicleType}
              onSelectionChange={(key) => setVehicleType(String(key))}
              options={vehicles.map((key) => ({
                key,
                label: key.replaceAll("_", " "),
              }))}
            />
            <DatePicker
              label="Vehicle registration date"
              name="vehicleRegistrationDate"
              isRequired
            />
            <Field
              label={`Vehicle brand${motorized.has(vehicleType) ? "" : " (optional)"}`}
              name="vehicleBrand"
              required={motorized.has(vehicleType)}
            />
            <Field
              label={`Plate number${motorized.has(vehicleType) ? "" : " (optional)"}`}
              name="plateNumber"
              required={motorized.has(vehicleType)}
            />
            <Field
              label="Rider revenue share (%)"
              name="revenueSharePct"
              type="number"
              min="0.01"
              max="100"
              step="0.01"
            />
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold">Guarantor / next of kin</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Name" name="guarantorName" />
            <Field label="Phone" name="guarantorPhone" type="tel" />
            <Field
              label="Email (optional)"
              name="guarantorEmail"
              type="email"
              required={false}
            />
            <Field
              label="Address (optional)"
              name="guarantorAddress"
              required={false}
            />
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold">Compliance documents</h3>
          <p className="mt-1 text-sm text-muted">
            JPG, PNG, or PDF. Maximum 15 MB per file.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {documentFields.map(([type, label, required]) => (
              <FormField
                key={type}
                label={`${label}${required ? " *" : " (optional)"}`}
              >
                <FileInput
                  name={`document-${type}`}
                  required={required}
                  accept="image/jpeg,image/png,application/pdf"
                />
              </FormField>
            ))}
          </div>
        </Card>
        <Card size="sm">
          <Checkbox isSelected={termsAccepted} onChange={setTermsAccepted}>
            I confirm the dispatcher has agreed to the applicable terms and the
            supplied information is accurate.
          </Checkbox>
        </Card>
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/people/dispatchers")}
          >
            Cancel
          </Button>
          <Button loading={loading} disabled={!termsAccepted}>
            Submit for review
          </Button>
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  required = true,
  ...props
}: React.ComponentProps<typeof Input> & { label: string; required?: boolean }) {
  return (
    <FormField label={label}>
      <Input required={required} {...props} />
    </FormField>
  );
}
