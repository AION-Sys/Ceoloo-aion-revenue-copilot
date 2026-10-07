"use client";

import Link from "next/link";
import { BookOpen, Mail, Phone, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const QUICK_ADD_OPTIONS = [
  {
    title: "Prospect workspace",
    href: "/prospects",
    icon: Users,
    description: "Open context, history, and qualification gaps",
  },
  {
    title: "Calls",
    href: "/calls",
    icon: Phone,
    description: "Enter live capture or post-call review",
  },
  {
    title: "Follow-Up draft",
    href: "/follow-up",
    icon: Mail,
    description: "Approve message/task drafts — not auto-sent",
  },
  {
    title: "Learning",
    href: "/learning",
    icon: BookOpen,
    description: "Review interventions and stage movement",
  },
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
          <DialogTitle>Command jump</DialogTitle>
          <DialogDescription>
            Stay inside the 7-screen cockpit — no CRM side quests.
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
      </DialogContent>
    </Dialog>
  );
}
