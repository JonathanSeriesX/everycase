import type { Metadata } from "next";
import ProseArticle from "../../components/ProseArticle";

export const metadata: Metadata = {
  title: "About",
};

export const ensureStatic = "navigation";

export default function AboutPage() {
  return <ProseArticle slug="about" title="About" />;
}
