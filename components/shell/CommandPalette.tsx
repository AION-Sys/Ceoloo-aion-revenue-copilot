"use client";

import { useRouter } from "next/navigation";
import {
  Brain,
  LayoutDashboard,
  Phone,
  Plus,
  SquareKanban,
  CheckSquare,
  Sparkles,
  UserPlus,
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
      <CommandInput placeholder="Search leads, calls, contacts, or jump…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => run("/dashboard")}>
            <LayoutDashboard className="h-4 w-4" />
            Go to dashboard
          </CommandItem>
          <CommandItem onSelect={() => run("/calls")}>
            <Phone className="h-4 w-4" />
            Open calls
          </CommandItem>
          <CommandItem onSelect={() => run("/pipeline")}>
            <SquareKanban className="h-4 w-4" />
            Open pipeline
          </CommandItem>
          <CommandItem onSelect={() => run("/tasks")}>
            <CheckSquare className="h-4 w-4" />
            Open tasks
          </CommandItem>
          <CommandItem onSelect={() => run("/intelligence")}>
            <Brain className="h-4 w-4" />
            Ask Copilot / Intelligence
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
          <CommandItem onSelect={() => run("/calls")}>
            <Phone className="h-4 w-4" />
            Start call
          </CommandItem>
          <CommandItem onSelect={() => run("/contacts")}>
            <UserPlus className="h-4 w-4" />
            Add lead / contact
          </CommandItem>
          <CommandItem onSelect={() => run("/tasks")}>
            <Sparkles className="h-4 w-4" />
            Generate follow-up
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
