/*
  Password rules, with no imports, so both the server and a client component
  can use them. The hashing itself lives in ./password, which is server-only.
*/

export const MIN_PASSWORD_LENGTH = 10;

/**
 * Why 10 and not 8: this guards admin accounts that can edit every listing
 * on the site. Length beats complexity rules, so there is no requirement to
 * mix in punctuation that people only satisfy with "Password1!".
 */
export const PASSWORD_RULE_HINT = `At least ${MIN_PASSWORD_LENGTH} characters. A short phrase you can remember is stronger than one tricky word.`;

/** Null when acceptable, otherwise the reason to show the person. */
export function checkPasswordStrength(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  // Rejecting enormous inputs stops someone using the login form to make the
  // server do unbounded hashing work.
  if (password.length > 200) return "Password must be 200 characters or fewer.";
  return null;
}
