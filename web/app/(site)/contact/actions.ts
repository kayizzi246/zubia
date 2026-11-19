"use server";

import { db, isDatabaseConfigured } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";

export interface ContactResult {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
}

const TOPICS = ["general", "report", "advertise", "plans", "help"] as const;
type Topic = (typeof TOPICS)[number];

export async function sendContactMessage(_prev: ContactResult | null, formData: FormData): Promise<ContactResult> {
  // Hidden field that people never see; bots tend to fill it in.
  if (String(formData.get("website") ?? "")) return { ok: true, message: "Thanks, we got your message." };

  const topic = String(formData.get("topic") ?? "general") as Topic;
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const listingId = String(formData.get("listingId") ?? "").trim() || null;
  const plan = String(formData.get("plan") ?? "").trim();
  let message = String(formData.get("message") ?? "").trim();

  const errors: Record<string, string> = {};
  if (!TOPICS.includes(topic)) errors.topic = "Choose what this is about.";
  if (!name) errors.name = "Enter your name.";
  if (name.length > 120) errors.name = "That name is too long.";
  if (!email && !phone) errors.phone = "Give us a phone number or an email so we can reply.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Check this email address.";
  if (message.length < 5) errors.message = "Tell us a little more (at least 5 characters).";
  if (message.length > 4000) errors.message = "Please keep it under 4,000 characters.";
  if (Object.keys(errors).length > 0) return { ok: false, message: "Please fix the highlighted fields.", errors };

  if (plan) message = `[Plan: ${plan}] ${message}`;

  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      message: "Messages aren't connected yet (the database isn't set up). Please try again later.",
    };
  }

  const row = {
    topic,
    name,
    email: email || null,
    phone: phone || null,
    listingId,
    message,
  };

  try {
    await db.insert(contactMessages).values(row);
  } catch (error) {
    // 23503 is a foreign key violation: the listing was deleted between the
    // visitor opening the form and sending it. Their message still matters,
    // so keep it and record the id in the text instead of losing it.
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";

    if (code === "23503" && listingId) {
      try {
        await db.insert(contactMessages).values({
          ...row,
          listingId: null,
          message: `[Listing ${listingId}] ${message}`,
        });
        return { ok: true, message: "Thanks! We've got your message and will reply soon." };
      } catch (retryError) {
        console.error("Contact form insert failed on retry:", retryError);
      }
    } else {
      console.error("Contact form insert failed:", error);
    }

    return {
      ok: false,
      message: "Sorry, we couldn't send that. Please try again in a moment.",
    };
  }

  return { ok: true, message: "Thanks! We've got your message and will reply soon." };
}
