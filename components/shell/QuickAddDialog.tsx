"use client";

import Link from "next/link";
import {
  Building2,
  FileText,
  Phone,
  SquareKanban,
  CheckSquare,
  UserPlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const QUICK_ADD_OPTIONS = [
  { title: "Lead", href: "/contacts", icon: UserPlus, description: "Capture a new prospect" },
  { title: "Contact", href: "/contacts", icon: UserPlus, description: "Add a person" },
  { title: "Deal", href: "/pipeline", icon: SquareKanban, description: "Create pipeline opportunity" },
  { title: "Call", href: "/calls", icon: Phone, description: "Start or schedule a call" },
  { title: "Task", href: "/tasks", icon: CheckSquare, description: "Queue a follow-up" },
  { title: "Note", href: "/activity", icon: FileText, description: "Log a note" },
] as const;

type QuickAddDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function QuickAddDialog({ open, onOpenChange }: QuickAddDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add</DialogTitle>
          <DialogDescription>
            Create the next revenue action without leaving your flow.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {QUICK_ADD_OPTIONS.map((option) => (
            <Link
              key={option.title}
              href={option.href}
              onClick={() => onOpenChange(false)}
              className="flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted"
            >
              <option.icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <span>
                <span className="block text-sm font-medium">{option.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </Link>
          ))}
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          Creation forms land in later workflow phases — navigation is wired now.
        </p>
      </DialogContent>
    </Dialog>
  );
}
