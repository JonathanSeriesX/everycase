import { notFound } from "next/navigation";
import { getProsePage } from "../../lib/notes";
import MdxContent from "../../components/MdxContent";
import Breadcrumb from "../../components/Breadcrumb";

export const dynamic = "force-static";

export const metadata = {
  title: "About",
};

export default async function AboutPage() {
  const Content = await getProsePage("about");
  if (!Content) notFound();
  return (
    <article data-pagefind-body>
      <Breadcrumb trail={[{ href: "/about", title: "About" }]} />
      <MdxContent Content={Content} />
    </article>
  );
}
