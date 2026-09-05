import {
  Activity,
  BookOpen,
  Brain,
  Building2,
  LayoutDashboard,
  Phone,
  Plug,
  Settings,
  SquareKanban,
  CheckSquare,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const APP_NAV: NavSection[] = [
  {
    label: "Primary",
    items: [
      { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { title: "Calls", href: "/calls", icon: Phone },
      { title: "Pipeline", href: "/pipeline", icon: SquareKanban },
      { title: "Tasks", href: "/tasks", icon: CheckSquare },
      { title: "Intelligence", href: "/intelligence", icon: Brain },
      { title: "Learning", href: "/learning", icon: BookOpen },
    ],
  },
  {
    label: "Workspace",
    items: [
      { title: "Contacts", href: "/contacts", icon: Users },
      { title: "Accounts", href: "/accounts", icon: Building2 },
      { title: "Activity", href: "/activity", icon: Activity },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Integrations", href: "/integrations", icon: Plug },
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function breadcrumbForPath(pathname: string): string[] {
  if (pathname.startsWith("/dashboard")) return ["Revenue Copilot", "Overview"];
  if (pathname.startsWith("/calls")) return ["Revenue Copilot", "Calls"];
  if (pathname.startsWith("/pipeline")) return ["Revenue Copilot", "Pipeline"];
  if (pathname.startsWith("/tasks")) return ["Revenue Copilot", "Tasks"];
  if (pathname.startsWith("/intelligence")) return ["Revenue Copilot", "Intelligence"];
  if (pathname.startsWith("/learning")) return ["Revenue Copilot", "Learning"];
  if (pathname.startsWith("/contacts")) return ["Revenue Copilot", "Contacts"];
  if (pathname.startsWith("/accounts")) return ["Revenue Copilot", "Accounts"];
  if (pathname.startsWith("/activity")) return ["Revenue Copilot", "Activity"];
  if (pathname.startsWith("/integrations")) return ["Revenue Copilot", "Integrations"];
  if (pathname.startsWith("/settings")) return ["Revenue Copilot", "Settings"];
  if (pathname.startsWith("/leads")) return ["Revenue Copilot", "Lead"];
  return ["Revenue Copilot"];
}
