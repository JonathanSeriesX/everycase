import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProsePage } from "../../lib/notes";
import MdxContent from "../../components/MdxContent";
import Breadcrumb from "../../components/Breadcrumb";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Contact",
};

export default async function ContactPage() {
  const prose = await getProsePage("contact");
  if (!prose) notFound();
  return (
    <article data-pagefind-body>
      <Breadcrumb trail={[{ href: "/contact", title: "Contact" }]} />
      <MdxContent Content={prose.Content} />
    </article>
  );
}
