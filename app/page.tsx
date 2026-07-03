import type { Metadata } from "next";
import {
  HOME_CARDS,
  getGroup,
  getPage,
  getTopPage,
  getHeroCase,
  getGroupHeroCase,
  getHomePrefetchImageCodes,
} from "../lib/catalogue";
import { getProsePage } from "../lib/notes";
import MdxContent from "../components/MdxContent";
import NavCard, { CardGrid } from "../components/NavCard";
import PrefetchImages from "../components/PrefetchImages.client";

const PREVIEW_BASE_URL = "https://cloudfront.everycase.org/everypreview";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: { absolute: "Finest Woven" },
};

export default async function HomePage() {
  const intro = await getProsePage("index");
  return (
    <div data-pagefind-body>
      <MdxContent Content={intro?.Content} />
      <CardGrid>
        {HOME_CARDS.map((card) => {
          if (card.page !== undefined) {
            const page = card.group
              ? getPage(card.group, card.page)
              : getTopPage(card.page);
            if (!page) {
              throw new Error(`home: HOME_CARDS names unknown page "${card.page}"`);
            }
            return (
              <NavCard
                key={card.page}
                href={
                  card.group ? `/${card.group}/${page.slug}` : `/${page.slug}`
                }
                title={page.title}
                subtitle={page.blurb}
                heroCase={getHeroCase(page)}
                image={page.image}
              />
            );
          }
          const group = getGroup(card.group);
          if (!group) {
            throw new Error(`home: HOME_CARDS names unknown group "${card.group}"`);
          }
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
      {/* After this page has loaded, warm the cache with the first images of
          each destination card so the next click renders instantly. */}
      <PrefetchImages
        urls={getHomePrefetchImageCodes().map(
          (code) => `${PREVIEW_BASE_URL}/${code}.avif`,
        )}
      />
    </div>
  );
}
