export function shortenAreaName(name: string): string {
  if (!name) return name;
  const cleaned = name.replace(/^Direito\s+(de|do|da|dos|das)?\s*/i, '').trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
