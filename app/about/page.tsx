import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProsePage } from "../../lib/notes";
import MdxContent from "../../components/MdxContent";
import Breadcrumb from "../../components/Breadcrumb";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "About",
};

export default async function AboutPage() {
  const prose = await getProsePage("about");
  if (!prose) notFound();
  return (
    <article data-pagefind-body>
      <Breadcrumb trail={[{ href: "/about", title: "About" }]} />
      <MdxContent Content={prose.Content} />
    </article>
  );
}
