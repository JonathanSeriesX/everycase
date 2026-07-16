import type { Metadata } from "next";
import ProseArticle from "../../components/ProseArticle";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return <ProseArticle slug="about" title="About" />;
}
