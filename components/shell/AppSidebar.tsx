"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronsUpDown,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { APP_NAV } from "@/lib/navigation";
import { cn, displayNameFromEmail, initialsFromName } from "@/lib/utils";

type AppSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  repEmail: string;
  organizationName: string;
  role: string;
};

export function AppSidebar({
  collapsed,
  onToggle,
  repEmail,
  organizationName,
  role,
}: AppSidebarProps) {
  const pathname = usePathname();
  const repName = displayNameFromEmail(repEmail);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "sticky top-0 flex h-svh shrink-0 flex-col border-r border-border/80 bg-card/80 backdrop-blur-sm transition-[width] duration-200 ease-cockpit",
          collapsed ? "w-[68px]" : "w-[248px]",
        )}
      >
        <div
          className={cn(
            "flex h-14 items-center border-b border-border/80 px-3",
            collapsed ? "justify-center" : "justify-between gap-2",
          )}
        >
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                AION
              </p>
              <p className="truncate text-sm font-semibold tracking-tight">
                Revenue Copilot
              </p>
            </div>
          ) : (
            <span className="font-mono text-sm font-semibold tracking-tight text-ai">
              RC
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-3">
          {APP_NAV.map((section) => (
            <div key={section.label}>
              {!collapsed ? (
                <p className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {section.label}
                </p>
              ) : null}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  const link = (
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-[background-color,color,transform] duration-200 ease-cockpit",
                        active
                          ? "nav-active-rail bg-ai/10 font-medium text-foreground"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                        collapsed && "justify-center px-0",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          active ? "text-ai" : "text-muted-foreground group-hover:text-foreground",
                        )}
                      />
                      {!collapsed ? <span>{item.title}</span> : null}
                    </Link>
                  );

                  if (!collapsed) {
                    return <li key={item.href}>{link}</li>;
                  }

                  return (
                    <li key={item.href}>
                      <Tooltip>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">{item.title}</TooltipContent>
                      </Tooltip>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-border/80 p-2">
          <div
            className={cn(
              "mb-1 flex items-center gap-1",
              collapsed && "flex-col",
            )}
          >
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Help">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 rounded-md border border-border/80 px-2 py-2 text-left transition-colors hover:bg-muted/70",
                  collapsed && "justify-center border-0 px-0",
                )}
              >
                <Avatar className="h-7 w-7 rounded-md">
                  <AvatarFallback className="rounded-md bg-secondary text-[11px] font-semibold">
                    {initialsFromName(repName)}
                  </AvatarFallback>
                </Avatar>
                {!collapsed ? (
                  <>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium">
                        {repName}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {organizationName}
                      </span>
                    </span>
                    <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </>
                ) : null}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">{repName}</p>
                  <p className="text-xs font-normal">{repEmail}</p>
                  <p className="text-xs font-normal capitalize">{role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/auth/signout">Sign out</a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );
}
