"use client";

import { useRouter } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  Mail,
  Phone,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuickAdd: () => void;
};

export function CommandPalette({
  open,
  onOpenChange,
  onQuickAdd,
}: CommandPaletteProps) {
  const router = useRouter();

  function run(path: string) {
    onOpenChange(false);
    router.push(path);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Jump to Today, Prospects, Calls, Follow-Up…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Command center">
          <CommandItem onSelect={() => run("/dashboard")}>
            <LayoutDashboard className="h-4 w-4" />
            Today
          </CommandItem>
          <CommandItem onSelect={() => run("/prospects")}>
            <Users className="h-4 w-4" />
            Prospects
          </CommandItem>
          <CommandItem onSelect={() => run("/calls")}>
            <Phone className="h-4 w-4" />
            Calls
          </CommandItem>
          <CommandItem onSelect={() => run("/follow-up")}>
            <Mail className="h-4 w-4" />
            Follow-Up
          </CommandItem>
          <CommandItem onSelect={() => run("/learning")}>
            <BookOpen className="h-4 w-4" />
            Learning
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              onQuickAdd();
            }}
          >
            <Plus className="h-4 w-4" />
            Quick add
          </CommandItem>
          <CommandItem onSelect={() => run("/prospects")}>
            <Sparkles className="h-4 w-4" />
            Open call prep from prospect
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
