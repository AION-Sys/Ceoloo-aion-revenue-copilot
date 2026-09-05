import { describe, expect, it } from "vitest";
import {
  createDiscoveryChecklist,
  isQualificationState,
  syncDiscoveryChecklist,
} from "@/lib/intelligence/call-workspace";

describe("call workspace helpers", () => {
  it("creates unchecked discovery items from guidance labels", () => {
    const items = createDiscoveryChecklist(["Confirm decision-maker", "Validate pain"]);

    expect(items).toEqual([
      { id: "discovery-0", label: "Confirm decision-maker", checked: false, notes: "" },
      { id: "discovery-1", label: "Validate pain", checked: false, notes: "" },
    ]);
  });

  it("preserves checked state and notes when syncing refreshed labels", () => {
    const previous = createDiscoveryChecklist(["Confirm decision-maker", "Validate pain"]);
    previous[0]!.checked = true;
    previous[0]!.notes = "Owner is on the call";
    previous[1]!.notes = "Lead response delays";

    const synced = syncDiscoveryChecklist(
      ["Confirm decision-maker", "Quantify impact", "Validate pain"],
      previous,
    );

    expect(synced).toEqual([
      {
        id: "discovery-0",
        label: "Confirm decision-maker",
        checked: true,
        notes: "Owner is on the call",
      },
      { id: "discovery-1", label: "Quantify impact", checked: false, notes: "" },
      {
        id: "discovery-2",
        label: "Validate pain",
        checked: false,
        notes: "Lead response delays",
      },
    ]);
  });

  it("validates qualification states", () => {
    expect(isQualificationState("exploring")).toBe(true);
    expect(isQualificationState("maybe")).toBe(false);
  });
});
