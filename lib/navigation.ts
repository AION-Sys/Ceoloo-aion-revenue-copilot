import {
  BookOpen,
  LayoutDashboard,
  Mail,
  Phone,
  Settings,
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

/**
 * Tight 7-screen Product Lab cockpit.
 * Workflow screens (Call Prep / Live / Review) open from Prospects + Calls.
 */
export const APP_NAV: NavSection[] = [
  {
    label: "Command",
    items: [
      { title: "Today", href: "/dashboard", icon: LayoutDashboard },
      { title: "Prospects", href: "/prospects", icon: Users },
      { title: "Calls", href: "/calls", icon: Phone },
      { title: "Follow-Up", href: "/follow-up", icon: Mail },
      { title: "Learning", href: "/learning", icon: BookOpen },
    ],
  },
  {
    label: "System",
    items: [{ title: "Settings", href: "/settings", icon: Settings }],
  },
];

export function breadcrumbForPath(pathname: string): string[] {
  if (pathname.startsWith("/dashboard")) {
    return ["Revenue Copilot", "Today"];
  }
  if (pathname.startsWith("/prospects") && pathname.includes("/prep")) {
    return ["Revenue Copilot", "Prospects", "Call Prep"];
  }
  if (pathname.startsWith("/prospects")) {
    return ["Revenue Copilot", "Prospects"];
  }
  if (pathname.startsWith("/calls") && pathname.includes("/live")) {
    return ["Revenue Copilot", "Calls", "Live"];
  }
  if (pathname.startsWith("/calls") && pathname.includes("/review")) {
    return ["Revenue Copilot", "Calls", "Post-Call Review"];
  }
  if (pathname.startsWith("/calls")) {
    return ["Revenue Copilot", "Calls"];
  }
  if (pathname.startsWith("/follow-up")) {
    return ["Revenue Copilot", "Follow-Up"];
  }
  if (pathname.startsWith("/learning")) {
    return ["Revenue Copilot", "Learning"];
  }
  if (pathname.startsWith("/settings")) {
    return ["Revenue Copilot", "Settings"];
  }
  if (pathname.startsWith("/leads")) {
    return ["Revenue Copilot", "Call Prep"];
  }
  return ["Revenue Copilot"];
}
