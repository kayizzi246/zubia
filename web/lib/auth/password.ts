import "server-only";
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";
import { promisify } from "node:util";

/*
  Password hashing, replacing Supabase Auth.

  scrypt is used because it ships with Node, so there is no native module to
  compile and nothing to install on the server. It is a memory-hard function,
  which is what makes a stolen hash expensive to crack.

  Stored format:  scrypt$N$r$p$<salt base64>$<hash base64>
  The parameters live in the string, so they can be raised later without
  invalidating everyone's existing password.
*/

// promisify picks the overload without options, so the signature is restated
// here to keep the N/r/p parameters.
const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>;

// OWASP's floor for scrypt is N=2^17, r=8, p=1. N=2^16 with r=8 needs about
// 64 MB per hash, which is a sensible balance on a small VPS; raise N if the
// server has memory to spare.
const PARAMS = { N: 2 ** 16, r: 8, p: 1 };
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/** scrypt needs maxmem above roughly 128 * N * r, or it refuses to run. */
const MAX_MEM = 256 * PARAMS.N * PARAMS.r;

// The rules live in ./rules, with no imports, so the sign-up and
// accept-invite forms can show them without pulling this module (and
// node:crypto) towards the browser.
export {
  checkPasswordStrength,
  MIN_PASSWORD_LENGTH,
  PASSWORD_RULE_HINT,
} from "./rules";

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const hash = (await scrypt(password, salt, KEY_LENGTH, {
    ...PARAMS,
    maxmem: MAX_MEM,
  })) as Buffer;

  return [
    "scrypt",
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString("base64"),
    hash.toString("base64"),
  ].join("$");
}

/**
 * Checks a password against a stored hash.
 *
 * Returns false rather than throwing for a null or malformed hash, so an
 * invited account that has not set a password yet simply cannot sign in.
 */
export async function verifyPassword(
  password: string,
  stored: string | null,
): Promise<boolean> {
  if (!stored) return false;

  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) {
    return false;
  }

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[4], "base64");
    expected = Buffer.from(parts[5], "base64");
  } catch {
    return false;
  }
  if (expected.length === 0) return false;

  let actual: Buffer;
  try {
    actual = (await scrypt(password, salt, expected.length, {
      N,
      r,
      p,
      maxmem: Math.max(MAX_MEM, 256 * N * r),
    })) as Buffer;
  } catch {
    // Stored parameters we cannot satisfy, e.g. an N larger than maxmem.
    return false;
  }

  // Constant-time, so the comparison cannot leak the hash a byte at a time.
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
