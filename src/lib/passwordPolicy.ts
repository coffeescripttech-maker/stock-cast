import type { SecuritySettings } from '../types/settings';

export interface PasswordRuleCheck {
  label: string;
  ok: boolean;
}

export function passwordRuleChecks(password: string): PasswordRuleCheck[] {
  return [
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', ok: /[a-z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
    { label: 'Special char', ok: /[^A-Za-z0-9]/.test(password) },
  ];
}

export interface PasswordValidation {
  minLength: number;
  requireStrong: boolean;
  rules: PasswordRuleCheck[];
  tooShort: boolean;
  /** Label of the first unmet strong-password rule (when applicable), else null. */
  unmetRule: string | null;
  /** Full validity: meets length AND (when required) all strength rules. */
  valid: boolean;
}

/**
 * Client-side mirror of the store's password policy (server re-checks anyway).
 * Security settings come from `useSettingsStore(s => s.settings.security)`.
 */
export function passwordValidation(
  security: SecuritySettings,
  password: string
): PasswordValidation {
  const minLength = Math.max(security.passwordMinLength || 6, 4);
  const requireStrong = !!security.requireStrongPassword;
  const rules = requireStrong ? passwordRuleChecks(password) : [];
  const unmetRule = rules.find((r) => !r.ok)?.label ?? null;
  return {
    minLength,
    requireStrong,
    rules,
    tooShort: password.length > 0 && password.length < minLength,
    unmetRule,
    valid:
      password.length >= minLength &&
      (requireStrong ? rules.every((r) => r.ok) : true),
  };
}