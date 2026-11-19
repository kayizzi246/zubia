import { db, isDatabaseConfigured } from "@/lib/db";
import { MESSAGE_TOPICS, type MessageTopic } from "@/lib/db/enums";
import { contactMessages } from "@/lib/db/schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { badRequest, ok, tooManyRequests, unavailable } from "../_lib/respond";

/*
  POST /api/v1/messages
  { "topic": "general", "name": "...", "phone": "...", "email": "...",
    "listingId": "zb-031", "message": "..." }

  An enquiry or a report from the app. The same table the website's contact
  form writes to, so the admin inbox is one list however it arrived.

  Deliberately open to signed-out people: most renters will tap "ask about
  this room" long before they make an account, and making them sign up
  first would simply lose the enquiry.
*/

const MAX_MESSAGE = 4000;

/*
  Enquiries are open to signed-out people on purpose, which is exactly
  what makes the endpoint worth spamming. Six an hour per IP is far more
  than a real person sends and little use to a flooder. Several renters
  behind one office or campus NAT share a bucket; that is the cost of
  having no account to count against, and six still covers a genuine
  afternoon of enquiries.
*/
const MESSAGE_WINDOW_MS = 60 * 60_000;
const MAX_MESSAGES_PER_IP = 6;

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return unavailable("Messages are not connected yet.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Send a JSON body.");
  }

  const input = (body ?? {}) as Record<string, unknown>;
  const str = (key: string) =>
    typeof input[key] === "string" ? (input[key] as string).trim() : "";

  const topicRaw = str("topic") || "general";
  const topic = (MESSAGE_TOPICS as readonly string[]).includes(topicRaw)
    ? (topicRaw as MessageTopic)
    : "general";

  const name = str("name");
  const email = str("email");
  const phone = str("phone");
  const listingId = str("listingId") || null;
  const message = str("message");

  // The same rules as the website's form, so neither route can be used to
  // write a row the other would have rejected.
  if (!name) return badRequest("Enter your name.");
  if (name.length > 120) return badRequest("That name is too long.");
  if (!email && !phone) {
    return badRequest("Give a phone number or an email so we can reply.");
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return badRequest("Check that email address.");
  }
  if (message.length < 5) return badRequest("Tell us a little more.");
  if (message.length > MAX_MESSAGE) {
    return badRequest(`Please keep it under ${MAX_MESSAGE} characters.`);
  }

  // After validation, so a rejected request does not spend the budget.
  const limit = rateLimit(
    `messages:ip:${clientIp(request)}`,
    MAX_MESSAGES_PER_IP,
    MESSAGE_WINDOW_MS,
  );
  if (!limit.allowed) {
    return tooManyRequests(
      limit.retryAfter,
      "You have sent several messages already. Please wait a little before sending another.",
    );
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
    // 23503: the listing was deleted between the app loading it and sending.
    // The enquiry still matters, so keep it with the id in the text.
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
        return ok({ sent: true }, { status: 201 });
      } catch (retryError) {
        console.error("API message insert failed on retry:", retryError);
      }
    } else {
      console.error("API message insert failed:", error);
    }

    return badRequest("Sorry, we couldn't send that. Please try again.");
  }

  return ok({ sent: true }, { status: 201 });
}
