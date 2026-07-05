// GitHub-style heading slugs, matching the anchors Nextra generated so old
// deep links (e.g. /iphone/iphone-12#leather-sleeve) keep working.
export function slugify(text: string): string {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s/g, "-");
}
