// Drizzle schema. This mirrors db/migrations/001_schema.sql exactly.
//
// The SQL file is the source of truth: it is what actually creates the
// database, and it holds the CHECK constraints and partial indexes that
// Drizzle cannot fully express. This file exists so queries are typed and
// so column names are written once.
//
// If you change one, change the other.

import {
  bigint,
  boolean,
  doublePrecision,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { LISTING_STATUSES, MESSAGE_TOPICS, USER_ROLES } from "./enums";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const listingTypeEnum = pgEnum("listing_type", ["buy", "rent", "land"]);

export const tenureEnum = pgEnum("tenure", [
  "mailo",
  "freehold",
  "leasehold",
  "kibanja",
  "condominium",
]);

export const sellerTypeEnum = pgEnum("seller_type", [
  "owner",
  "broker",
  "agency",
  "developer",
]);

// These three come from ./enums so the app's unions and the database types
// cannot drift apart.
export const listingStatusEnum = pgEnum("listing_status", LISTING_STATUSES);
export const messageTopicEnum = pgEnum("message_topic", MESSAGE_TOPICS);
export const userRoleEnum = pgEnum("user_role", USER_ROLES);

export const unitTypeEnum = pgEnum("unit_type", [
  "single_room",
  "double_room",
  "bedsitter",
  "one_bedroom",
  "two_bedroom",
  "three_bedroom",
  "house",
  "bq",
  "hostel",
]);

export const bathroomKindEnum = pgEnum("bathroom_kind", [
  "inside",
  "outside_private",
  "shared",
]);

export const waterSourceEnum = pgEnum("water_source", [
  "piped_inside",
  "piped_yard",
  "shared_tap",
  "borehole",
]);

export const powerSupplyEnum = pgEnum("power_supply", [
  "own_yaka",
  "shared_meter",
  "included",
  "none",
]);

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    /** Null until the person sets a password from an invite link. */
    passwordHash: text("password_hash"),
    fullName: text("full_name"),
    phone: text("phone"),
    role: userRoleEnum("role").notNull().default("user"),
    /** A hash of the one-time invite token, never the token itself. */
    inviteTokenHash: text("invite_token_hash"),
    inviteExpiresAt: timestamp("invite_expires_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("users_role_idx").on(t.role),
    // The unique index on lower(email) and the partial invite index live in
    // the SQL migration: Drizzle cannot express either.
  ],
);

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** SHA-256 of the token. The token itself is never stored. */
    tokenHash: text("token_hash").notNull().unique(),
    userAgent: text("user_agent"),
    ip: text("ip"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("sessions_user_idx").on(t.userId),
    index("sessions_expires_idx").on(t.expiresAt),
  ],
);

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

export const listings = pgTable(
  "listings",
  {
    id: text("id").primaryKey(),
    type: listingTypeEnum("type").notNull(),
    title: text("title").notNull(),
    // bigint comes back as a string by default; mode "number" keeps it a
    // number, which is safe because UGX prices are far below 2^53.
    priceUgx: bigint("price_ugx", { mode: "number" }).notNull(),
    area: text("area").notNull(),
    district: text("district").notNull(),
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),
    sizeDecimals: numeric("size_decimals").notNull(),
    tenure: tenureEnum("tenure").notNull(),
    titleChecked: boolean("title_checked").notNull().default(false),
    sellerType: sellerTypeEnum("seller_type").notNull(),
    featured: boolean("featured").notNull().default(false),
    photos: text("photos").array().notNull().default([]),
    sellerName: text("seller_name"),
    /** International digits without the +, e.g. 256772123456. */
    sellerPhone: text("seller_phone"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    description: text("description").notNull().default(""),
    status: listingStatusEnum("status").notNull().default("pending"),
    ownerId: uuid("owner_id").references(() => users.id, {
      onDelete: "set null",
    }),

    // --- Rentals -----------------------------------------------------------
    unitType: unitTypeEnum("unit_type"),
    bathroom: bathroomKindEnum("bathroom"),
    ownKitchen: boolean("own_kitchen"),
    water: waterSourceEnum("water"),
    power: powerSupplyEnum("power"),
    fenced: boolean("fenced"),
    advanceMonths: smallint("advance_months"),
    depositMonths: smallint("deposit_months"),
    brokerFeeMonths: smallint("broker_fee_months"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("listings_public_idx").on(t.status, t.type, t.district),
    index("listings_owner_idx").on(t.ownerId),
    index("listings_created_idx").on(t.createdAt),
    // The two partial rental indexes live in the SQL migration.
  ],
);

// ---------------------------------------------------------------------------
// Contact messages
// ---------------------------------------------------------------------------

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    topic: messageTopicEnum("topic").notNull().default("general"),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    listingId: text("listing_id").references(() => listings.id, {
      onDelete: "set null",
    }),
    message: text("message").notNull(),
    handled: boolean("handled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("contact_messages_created_idx").on(t.createdAt)],
);

// ---------------------------------------------------------------------------
// Inferred row types
// ---------------------------------------------------------------------------

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type SessionRow = typeof sessions.$inferSelect;
export type ListingDbRow = typeof listings.$inferSelect;
export type NewListingDbRow = typeof listings.$inferInsert;
export type ContactMessageRow = typeof contactMessages.$inferSelect;
