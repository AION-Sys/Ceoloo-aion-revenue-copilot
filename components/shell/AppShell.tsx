"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/shell/AppHeader";
import { AppSidebar } from "@/components/shell/AppSidebar";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { QuickAddDialog } from "@/components/shell/QuickAddDialog";
import { displayNameFromEmail } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  repEmail: string;
  organizationName: string;
  role: string;
};

export function AppShell({
  children,
  repEmail,
  organizationName,
  role,
}: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [quickAddOpen, setQuickAddOpen] = React.useState(false);
  const repName = displayNameFromEmail(repEmail);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <AppSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
        repEmail={repEmail}
        organizationName={organizationName}
        role={role}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          pathname={pathname}
          repName={repName}
          onOpenCommand={() => setCommandOpen(true)}
          onOpenQuickAdd={() => setQuickAddOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onQuickAdd={() => setQuickAddOpen(true)}
      />
      <QuickAddDialog open={quickAddOpen} onOpenChange={setQuickAddOpen} />
    </div>
  );
}
