/*
  The enum values, written once.

  db/migrations/001_schema.sql declares these types in Postgres, lib/db/schema.ts
  declares them for Drizzle, and the app needs them as TypeScript unions. This
  file is the single list all three agree on.

  It deliberately imports nothing, so client components can use it.
*/

export const USER_ROLES = [
  "user",
  "agent",
  "works_admin",
  "broker_admin",
  "super_admin",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const LISTING_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "archived",
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const MESSAGE_TOPICS = [
  "general",
  "report",
  "advertise",
  "plans",
  "help",
] as const;
export type MessageTopic = (typeof MESSAGE_TOPICS)[number];
