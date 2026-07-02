import { GROUPS, getGroupHeroCase } from "../lib/catalogue";
import { getProsePage } from "../lib/notes";
import MdxContent from "../components/MdxContent";
import NavCard, { CardGrid } from "../components/NavCard";

export const dynamic = "force-static";

export const metadata = {
  title: { absolute: "Finest Woven" },
};

export default async function HomePage() {
  const Intro = await getProsePage("index");
  return (
    <div data-pagefind-body>
      <MdxContent Content={Intro} />
      <CardGrid>
        {GROUPS.map((group) => (
          <NavCard
            key={group.slug}
            href={`/${group.slug}`}
            title={group.title}
            subtitle={group.blurb}
            heroCase={getGroupHeroCase(group)}
          />
        ))}
      </CardGrid>
    </div>
  );
}
