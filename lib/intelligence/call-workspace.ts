import type { QualificationState } from "@/lib/sales/types";

export type DiscoveryChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
  notes: string;
};

export const QUALIFICATION_OPTIONS: ReadonlyArray<{
  value: QualificationState;
  label: string;
  description: string;
}> = [
  {
    value: "unqualified",
    label: "Unqualified",
    description: "Workflow and implementation fit are not yet understood",
  },
  {
    value: "exploring",
    label: "Exploring",
    description: "Business audit or workflow diagnosis is in progress",
  },
  {
    value: "qualified",
    label: "Qualified",
    description: "Problem, impact, and implementation fit are confirmed",
  },
  {
    value: "disqualified",
    label: "Disqualified",
    description: "Not a fit for an AION engagement right now",
  },
];

export function createDiscoveryChecklist(labels: string[]): DiscoveryChecklistItem[] {
  return labels.map((label, index) => ({
    id: `discovery-${index}`,
    label,
    checked: false,
    notes: "",
  }));
}

/** Preserve checked/notes when guidance refresh returns a new label list. */
export function syncDiscoveryChecklist(
  labels: string[],
  previous: DiscoveryChecklistItem[],
): DiscoveryChecklistItem[] {
  return labels.map((label, index) => {
    const existing = previous.find((item) => item.label === label);
    return {
      id: `discovery-${index}`,
      label,
      checked: existing?.checked ?? false,
      notes: existing?.notes ?? "",
    };
  });
}

export function isQualificationState(value: string): value is QualificationState {
  return QUALIFICATION_OPTIONS.some((option) => option.value === value);
}
