export function ensureString(value: any): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  } catch {
    return "";
  }
}
