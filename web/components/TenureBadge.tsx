import { TENURE_LABELS } from "@/lib/format";
import type { Tenure } from "@/lib/types";

export function TenureBadge({ tenure }: { tenure: Tenure }) {
  return (
    <span className="inline-flex items-center rounded-full border border-line bg-surface px-2.5 py-0.5 text-[11px] font-medium text-ink">
      {TENURE_LABELS[tenure]}
    </span>
  );
}
