import type { Metadata } from "next";
import ProseArticle from "../../components/ProseArticle";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Support",
};

export default function SupportPage() {
  return <ProseArticle slug="support" title="Support" />;
}
