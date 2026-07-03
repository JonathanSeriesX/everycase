import {
  HOME_CARDS,
  getGroup,
  getPage,
  getTopPage,
  getHeroCase,
  getGroupHeroCase,
} from "../lib/catalogue";
import { getProsePage } from "../lib/notes";
import MdxContent from "../components/MdxContent";
import NavCard, { CardGrid } from "../components/NavCard";

export const dynamic = "force-static";

export const metadata = {
  title: { absolute: "Finest Woven" },
};

export default async function HomePage() {
  const intro = await getProsePage("index");
  return (
    <div data-pagefind-body>
      <MdxContent Content={intro?.Content} />
      <CardGrid>
        {HOME_CARDS.map((card) => {
          if (card.page) {
            const page = card.group
              ? getPage(card.group, card.page)
              : getTopPage(card.page);
            return (
              <NavCard
                key={card.page}
                href={
                  card.group
                    ? `/${card.group}/${page.slug}`
                    : `/${page.slug}`
                }
                title={page.title}
                subtitle={page.blurb}
                heroCase={getHeroCase(page)}
                image={page.image}
              />
            );
          }
          const group = getGroup(card.group);
          return (
            <NavCard
              key={card.group}
              href={`/${group.slug}`}
              title={group.title}
              subtitle={group.blurb}
              heroCase={getGroupHeroCase(group)}
              image={group.image}
            />
          );
        })}
      </CardGrid>
    </div>
  );
}
