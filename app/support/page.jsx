import { notFound } from "next/navigation";
import { getProsePage } from "../../lib/notes";
import MdxContent from "../../components/MdxContent";
import Breadcrumb from "../../components/Breadcrumb";

export const dynamic = "force-static";

export const metadata = {
  title: "Support",
};

export default async function SupportPage() {
  const prose = await getProsePage("support");
  if (!prose) notFound();
  return (
    <article data-pagefind-body>
      <Breadcrumb trail={[{ href: "/support", title: "Support" }]} />
      <MdxContent Content={prose.Content} />
    </article>
  );
}
