import type { Metadata } from "next";
import ProseArticle from "../../components/ProseArticle";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return <ProseArticle slug="contact" title="Contact" />;
}
