import { Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MessageActions } from "@/components/admin/MessageActions";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getContactMessages, type ContactMessage } from "@/lib/data/admin";
import { formatPhone, normalizeUgPhone } from "@/lib/format";

export const metadata: Metadata = { title: "Messages" };

const TOPIC_LABELS: Record<ContactMessage["topic"], string> = {
  general: "General",
  report: "Reported listing",
  advertise: "Advertising",
  plans: "Plans",
  help: "Account help",
};

export default async function MessagesPage() {
  const messages = await getContactMessages();
  const open = messages.filter((m) => !m.handled).length;

  return (
    <>
      <PageHeader title="Messages" description={`From the contact form · ${open} open`} />
      {messages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">No messages yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => {
            const phone = m.phone ? normalizeUgPhone(m.phone) : null;
            return (
              <Card key={m.id} className={m.handled ? "opacity-60" : m.topic === "report" ? "border-destructive/40" : ""}>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{m.name}</p>
                        <Badge variant={m.topic === "report" ? "destructive" : "secondary"}>{TOPIC_LABELS[m.topic]}</Badge>
                        {m.handled && <Badge variant="outline">Done</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(m.created_at).toLocaleString("en-UG", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                    <MessageActions id={m.id} handled={m.handled} />
                  </div>
                  <p className="whitespace-pre-line">{m.message}</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                    {phone && (
                      <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                        <Phone className="size-4" /> {formatPhone(phone)}
                      </a>
                    )}
                    {m.phone && !phone && <span className="inline-flex items-center gap-1.5"><Phone className="size-4" /> {m.phone}</span>}
                    {m.email && (
                      <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                        <Mail className="size-4" /> {m.email}
                      </a>
                    )}
                    {m.listing_id && (
                      <Link href={`/admin/listings/${m.listing_id}`} className="font-medium text-primary hover:underline">
                        Listing {m.listing_id}
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
