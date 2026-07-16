import { notFound } from "next/navigation";
import { getProsePage } from "../lib/notes";
import MdxContent from "./MdxContent";
import Breadcrumb from "./Breadcrumb";

/**
 * A whole-prose page (about, contact, support): breadcrumb + the compiled
 * MDX from content/<slug>.mdx, which supplies its own `# H1`.
 */
export default async function ProseArticle({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const prose = await getProsePage(slug);
  if (!prose) notFound();
  return (
    <article data-pagefind-body>
      <Breadcrumb trail={[{ href: `/${slug}`, title }]} />
      <MdxContent Content={prose.Content} />
    </article>
  );
}
