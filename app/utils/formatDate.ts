// Shared date formatter used across bill/vote/member views.
// Returns an em dash for empty values and echoes the raw string if it can't be parsed.
export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString();
  } catch {
    return value;
  }
}

export default formatDate;
