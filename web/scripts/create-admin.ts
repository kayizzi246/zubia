/*
  Creates (or promotes) a super admin.

    npm run db:create-admin -- you@example.com "Your Name"

  This is how the first admin gets in. Supabase had a dashboard for it; with
  Postgres alone there has to be a deliberate way to make the first account,
  and it has to run on the server rather than through a web form, or anyone
  could make themselves an admin.

  If the email already exists, it is promoted to super_admin and given a new
  password. The password is generated here rather than typed, so it never
  sits in your shell history, and it is printed once.
*/

import { randomBytes } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "../lib/db";
import { USER_ROLES, type UserRole } from "../lib/db/enums";
import { users } from "../lib/db/schema";
import { hashPassword } from "../lib/auth/password";

function generatePassword(): string {
  // base64url of 18 bytes: 24 characters, no lookalike-prone punctuation.
  return randomBytes(18).toString("base64url");
}

async function main() {
  const args = process.argv.slice(2);

  // Optional --role, so a demo account can be given any tier and you can see
  // what a works admin or broker admin actually sees. Defaults to the
  // highest tier, because the first account has to be able to do everything.
  let role: UserRole = "super_admin";
  const roleIndex = args.findIndex((a) => a === "--role");
  if (roleIndex !== -1) {
    const value = args[roleIndex + 1];
    if (!value || !USER_ROLES.includes(value as UserRole)) {
      console.error(`--role must be one of: ${USER_ROLES.join(", ")}`);
      process.exit(1);
    }
    role = value as UserRole;
    args.splice(roleIndex, 2);
  }

  const [emailArg, ...nameParts] = args;
  const email = (emailArg ?? "").trim().toLowerCase();
  const fullName = nameParts.join(" ").trim() || null;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(
      'Usage: npm run db:create-admin -- you@example.com "Your Name" [--role works_admin]',
    );
    console.error(`Roles: ${USER_ROLES.join(", ")}`);
    process.exit(1);
  }

  const password = generatePassword();
  const passwordHash = await hashPassword(password);

  const existing = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);

  if (existing[0]) {
    await db
      .update(users)
      .set({
        role,
        passwordHash,
        // Clear any outstanding invite so an old link cannot be used.
        inviteTokenHash: null,
        inviteExpiresAt: null,
        ...(fullName ? { fullName } : {}),
      })
      .where(eq(users.id, existing[0].id));
    console.log(`Updated ${email}: now ${role}, with a new password.`);
  } else {
    await db.insert(users).values({ email, fullName, role, passwordHash });
    console.log(`Created ${email} as ${role}.`);
  }

  console.log("");
  console.log("  Password:", password);
  console.log("");
  console.log("Shown once. Sign in at /admin/login, then change it.");
  if (role === "super_admin") {
    console.log("Invite the rest of the team from Users & admins.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Could not create the admin:", error);
    process.exit(1);
  });
