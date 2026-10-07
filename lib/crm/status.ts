import type { LeadStatus, QualificationState } from "@/lib/sales/types";

/**
 * Maps post-call qualification onto CRM lead status (AION FunnelStage).
 * Aligns with legacy status normalization in lib/sales/motion.ts.
 */
export function qualificationToLeadStatus(qualification: QualificationState): LeadStatus {
  switch (qualification) {
    case "qualified":
      return "qualified_opportunity";
    case "disqualified":
      return "closed_won";
    case "exploring":
    case "unqualified":
      return "business_audit";
  }
}
