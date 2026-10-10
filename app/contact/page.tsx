import type { Metadata } from "next";
import ProseArticle from "../../components/ProseArticle";

export const metadata: Metadata = {
  title: "Contact",
};

export const ensureStatic = "navigation";

export default function ContactPage() {
  return <ProseArticle slug="contact" title="Contact" />;
}
