import fs from "fs";
import path from "path";
import { compile, run } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import type { ComponentType } from "react";

// Editorial prose lives in content/ as plain MDX — no imports, no JSX
// skeleton. A notes file is a sequence of segments split on `## ` headings:
// the leading segment is the intro, and each heading segment either matches a
// catalogue kind (its prose renders above that kind's card grid) or stands on
// its own as a prose section. Compilation happens at build time, so pages
// stay fully static.

/** Overrides for MDX elements (a, h1, Callout, …), keyed by tag/name. */
// (`any` here matches how MDX types its own component maps.)
export type MdxComponentMap = Record<string, ComponentType<any>>;

/** A compiled MDX segment, ready to render. */
export type MdxComponent = ComponentType<{ components?: MdxComponentMap }>;

export interface PageNotes {
  intro: MdxComponent | null;
  /** True when the intro opens with its own `# Title`. */
  hasH1: boolean;
  sections: { heading: string; Content: MdxComponent | null }[];
}

export interface ProsePage {
  Content: MdxComponent | null;
  hasH1: boolean;
}

const CONTENT_DIR = path.join(process.cwd(), "content");

async function compileSegment(source: string): Promise<MdxComponent | null> {
  const trimmed = source.trim();
  if (!trimmed) return null;
  const compiled = await compile(trimmed, {
    outputFormat: "function-body",
    remarkPlugins: [remarkGfm],
  });
  const { default: MDXContent } = await run(compiled, {
    ...runtime,
    baseUrl: import.meta.url,
  });
  return MDXContent;
}

function readSource(...segments: string[]): string | null {
  for (const ext of [".mdx", ".md"]) {
    const filePath = path.join(CONTENT_DIR, ...segments) + ext;
    if (fs.existsSync(filePath)) return fs.readFileSync(filePath, "utf-8");
  }
  return null;
}

/**
 * Loads and compiles the notes for a page. Returns null when the page has no
 * notes file, otherwise:
 *   { intro: Component|null, sections: [{ heading, Content }] }
 * Section headings are kept verbatim; the page template decides whether a
 * heading names a kind (card grid attaches) or is pure prose.
 */
export async function getNotes(
  ...pathSegments: string[]
): Promise<PageNotes | null> {
  const source = readSource(...pathSegments);
  if (source == null) return null;

  const segments: { heading: string | null; lines: string[] }[] = [
    { heading: null, lines: [] },
  ];
  let current = segments[0];
  for (const line of source.split("\n")) {
    const match = line.match(/^##\s+(.+?)\s*$/);
    if (match) {
      current = { heading: match[1], lines: [] };
      segments.push(current);
    } else {
      current.lines.push(line);
    }
  }

  const [introSegment, ...rest] = segments;
  const introSource = introSegment.lines.join("\n");
  const intro = await compileSegment(introSource);
  const sections: PageNotes["sections"] = [];
  for (const segment of rest) {
    sections.push({
      heading: segment.heading ?? "",
      Content: await compileSegment(segment.lines.join("\n")),
    });
  }
  // When the intro provides its own `# Title`, the page template skips its
  // fallback <h1>.
  return { intro, hasH1: /^#\s/m.test(introSource), sections };
}

/** The `# Title` of a notes/prose file, without compiling it. */
export function getPageHeading(...segments: string[]): string | null {
  const source = readSource(...segments);
  return source?.match(/^#\s+(.+?)\s*$/m)?.[1] ?? null;
}

/** Compiles a whole prose page (about, support, group blurbs) as one unit. */
export async function getProsePage(
  ...segments: string[]
): Promise<ProsePage | null> {
  const source = readSource(...segments);
  if (source == null) return null;
  return {
    Content: await compileSegment(source),
    hasH1: /^#\s/m.test(source),
  };
}
