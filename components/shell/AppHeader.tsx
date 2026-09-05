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
        "sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className,
      )}
    >
      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm md:flex">
        {crumbs.map((crumb, index) => (
          <Fragment key={`${crumb}-${index}`}>
            {index > 0 ? (
              <span className="text-muted-foreground">/</span>
            ) : null}
            <span
              className={cn(
                "truncate",
                index === crumbs.length - 1
                  ? "font-medium text-foreground"
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
          className="hidden h-9 w-64 items-center gap-2 rounded-md border bg-muted/40 px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted lg:flex"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1">Search…</span>
          <kbd className="rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium text-foreground">
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
        <Button type="button" size="sm" onClick={onOpenQuickAdd}>
          <Plus className="h-4 w-4" />
          Quick Add
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarFallback>{initialsFromName(repName)}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
