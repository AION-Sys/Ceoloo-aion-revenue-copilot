"use client";

import { Fragment } from "react";
import { Bell, Plus, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { breadcrumbForPath } from "@/lib/navigation";
import { cn, initialsFromName } from "@/lib/utils";

type AppHeaderProps = {
  pathname: string;
  repName: string;
  onOpenCommand: () => void;
  onOpenQuickAdd: () => void;
  className?: string;
};

export function AppHeader({
  pathname,
  repName,
  onOpenCommand,
  onOpenQuickAdd,
  className,
}: AppHeaderProps) {
  const crumbs = breadcrumbForPath(pathname);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/80 bg-card/75 px-4 backdrop-blur-md md:px-7",
        className,
      )}
    >
      <nav
        aria-label="Breadcrumb"
        className="hidden min-w-0 items-center gap-1.5 text-sm md:flex"
      >
        {crumbs.map((crumb, index) => (
          <Fragment key={`${crumb}-${index}`}>
            {index > 0 ? (
              <span className="font-mono text-[11px] text-muted-foreground">/</span>
            ) : null}
            <span
              className={cn(
                "truncate tracking-tight",
                index === crumbs.length - 1
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {crumb}
            </span>
          </Fragment>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenCommand}
          className="hidden h-9 w-72 cursor-pointer items-center gap-2 rounded-md border border-border/80 bg-background/70 px-3 text-left text-sm text-muted-foreground transition-[background-color,border-color,transform] duration-200 ease-cockpit hover:border-ai/30 hover:bg-muted/60 active:scale-[0.99] lg:flex"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1">Jump screens or actions…</span>
          <kbd className="rounded border bg-card px-1.5 py-0.5 font-mono text-[10px] font-medium text-foreground">
            ⌘K
          </kbd>
        </button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="lg:hidden"
          onClick={onOpenCommand}
          aria-label="Open search"
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          className="active:scale-[0.98]"
          onClick={onOpenQuickAdd}
        >
          <Plus className="h-4 w-4" />
          Jump
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8 rounded-md">
          <AvatarFallback className="rounded-md bg-secondary text-[11px] font-semibold">
            {initialsFromName(repName)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
