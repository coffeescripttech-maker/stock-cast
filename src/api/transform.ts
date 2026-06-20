/**
 * Deep snake_case ↔ camelCase key transformation utilities.
 * Used to translate between the backend API (snake_case) and
 * the frontend Zustand stores (camelCase).
 */

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelToSnake(key: string): string {
  return key.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * Recursively transforms all object keys from snake_case to camelCase.
 * Handles plain objects, arrays, primitives, Date strings, and null.
 */
export function toCamelCase<T = unknown>(input: unknown): T {
  if (Array.isArray(input)) {
    return input.map(toCamelCase) as unknown as T;
  }

  if (!isObject(input)) {
    return input as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    result[snakeToCamel(key)] = toCamelCase(value);
  }
  return result as T;
}

/**
 * Recursively transforms all object keys from camelCase to snake_case.
 * Handles plain objects, arrays, primitives, Date strings, and null.
 */
export function toSnakeCase<T = unknown>(input: unknown): T {
  if (Array.isArray(input)) {
    return input.map(toSnakeCase) as unknown as T;
  }

  if (!isObject(input)) {
    return input as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    result[camelToSnake(key)] = toSnakeCase(value);
  }
  return result as T;
}
