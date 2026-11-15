"use client";

import { Check, RotateCcw, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteMessage, setMessageHandled, type ActionResult } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export function MessageActions({ id, handled }: { id: string; handled: boolean }) {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<ActionResult>) =>
    start(async () => {
      const r = await fn();
      if (r.ok) toast.success(r.message);
      else toast.error(r.message);
    });

  return (
    <div className="flex gap-2">
      <Button size="sm" variant={handled ? "outline" : "default"} className="h-9" disabled={pending} onClick={() => run(() => setMessageHandled(id, !handled))}>
        {handled ? <RotateCcw /> : <Check />}
        {handled ? "Reopen" : "Mark done"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-9 text-destructive hover:text-destructive"
        disabled={pending}
        aria-label="Delete message"
        onClick={() => {
          if (window.confirm("Delete this message for good?")) run(() => deleteMessage(id));
        }}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
