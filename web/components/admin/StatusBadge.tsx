import { Badge } from "@/components/ui/badge";
import type { ListingStatus } from "@/lib/db/rows";

const STYLES: Record<ListingStatus, string> = {
  pending: "bg-warning/15 text-warning border-warning/40",
  approved: "bg-primary/10 text-primary border-primary/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
  archived: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: ListingStatus }) {
  return (
    <Badge variant="outline" className={`capitalize ${STYLES[status]}`}>
      {status}
    </Badge>
  );
}
