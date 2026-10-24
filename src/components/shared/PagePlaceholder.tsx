import { Badge } from "../ui/Badge.tsx";
import { Card } from "../ui/Card.tsx";
export function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="mb-6">
        <Badge>Milestone 0</Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-2xl text-muted">{description}</p>
      </div>
      <Card>
        <h2 className="font-semibold">Foundation ready</h2>
        <p className="mt-2 text-sm text-muted">
          Business workflows will be implemented in the roadmap milestone that
          owns this module. No placeholder action writes production data.
        </p>
      </Card>
    </div>
  );
}
