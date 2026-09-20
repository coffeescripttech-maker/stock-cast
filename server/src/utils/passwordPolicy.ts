import { pool } from '../db/pool.js';
import type { MySqlRow } from '../types/common.types.js';

export interface PasswordPolicy {
  minLength: number;
  requireStrong: boolean;
}

/**
 * Read the store's password policy from the security settings stored in
 * system_settings (the same toggles the Settings → Users & Security page
 * edits). Falls back to safe defaults when the settings row is missing.
 */
export async function readPasswordPolicy(): Promise<PasswordPolicy> {
  try {
    const [[row]] = await pool.query<MySqlRow[]>(
      'SELECT settings FROM system_settings WHERE id = 1'
    );
    if (!row) return { minLength: 6, requireStrong: false };
    const settings = JSON.parse((row as { settings: string }).settings);
    const sec = settings?.security ?? {};
    return {
      minLength: Number(sec.passwordMinLength) > 0 ? Number(sec.passwordMinLength) : 6,
      requireStrong: Boolean(sec.requireStrongPassword),
    };
  } catch {
    return { minLength: 6, requireStrong: false };
  }
}

export interface PasswordRuleCheck {
  label: string;
  ok: boolean;
}

/**
 * Client-facing breakdown of the strong-password rules (uppercase, lowercase,
 * digit, special) — used by the Change Password dialog's live checklist.
 */
export function passwordRuleChecks(password: string): PasswordRuleCheck[] {
  return [
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', ok: /[a-z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
    { label: 'Special character', ok: /[^A-Za-z0-9]/.test(password) },
  ];
}

/**
 * Validate a plain password against the policy. Returns a user-facing error
 * message, or null when the password satisfies every rule.
 */
export function validatePasswordPolicy(
  password: string,
  policy: PasswordPolicy
): string | null {
  if (password.length < policy.minLength) {
    return `Password must be at least ${policy.minLength} characters`;
  }
  if (policy.requireStrong) {
    const failed = passwordRuleChecks(password).find((c) => !c.ok);
    if (failed) return `Password must include a ${failed.label.toLowerCase()}`;
  }
  return null;
}