import { headers } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "../../lib/auth";
import { db } from "../../lib/mongo";
import {
  getAllCasesFromCSV,
  type CaseRecord,
} from "../../lib/getCasesFromCSV";
import { sortCases } from "../../lib/catalogue";
import { CURRENCIES, type Currency } from "../../lib/currencies";
import { getCaseName } from "../../lib/caseName";
import CaseImage from "../../components/CaseImage.client";
import CollectionValue from "../../components/CollectionValue.client";
import carousel from "../../styles/VerticalCarousel.module.css";

// Personal, per-user page — always rendered on demand, never cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your collection",
  robots: { index: false },
};

function CaseGrid({ cases }: { cases: CaseRecord[] }) {
  return (
    <div className={carousel.cardTrack}>
      {cases.map((item) => {
        const name = getCaseName(item);
        return (
          <article key={item.SKU} className={carousel.caseCard}>
            <Link
              href={`/case/${item.SKU}`}
              className={carousel.cardLink}
              aria-label={name}
            >
              <div className={carousel.imageShell}>
                <CaseImage
                  code={(item.alt_thumbnail || item.SKU).trim()}
                  alt={name}
                />
              </div>
              <strong
                className={`${carousel.caseTitle} ${carousel.linkTitle}`}
              >
                {name}
              </strong>
            </Link>
          </article>
        );
      })}
    </div>
  );
}

export default async function CollectionPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return (
      <article>
        <h1>Your collection</h1>
        <p>
          Sign in with the account button in the top-right corner to start
          tracking the cases you own — and the ones you&rsquo;re still
          hunting for.
        </p>
      </article>
    );
  }

  const docs = await db
    .collection("collectionItems")
    .find({ userId: session.user.id })
    .toArray();

  const bySku = new Map(
    getAllCasesFromCSV().map((record) => [record.SKU, record]),
  );
  const resolve = (status: string) =>
    sortCases(
      docs
        .filter((doc) => doc.status === status)
        .map((doc) => bySku.get(doc.sku))
        .filter((record): record is CaseRecord => Boolean(record)),
    );
  const owned = resolve("owned");
  const wanted = resolve("wanted");

  const sums: Partial<Record<Currency, number>> = {};
  let pricedCount = 0;
  for (const item of owned) {
    if (item.prices.USD) pricedCount += 1;
    for (const code of CURRENCIES) {
      const amount = Number(item.prices[code]);
      if (item.prices[code] && Number.isFinite(amount)) {
        sums[code] = (sums[code] ?? 0) + amount;
      }
    }
  }

  return (
    <article>
      <h1>Your collection</h1>
      {owned.length === 0 && wanted.length === 0 ? (
        <p>
          Nothing here yet. Open any case page and tap{" "}
          <strong>I own it</strong> or <strong>I want it</strong> — it shows
          up here.
        </p>
      ) : (
        <>
          <CollectionValue
            sums={sums}
            pricedCount={pricedCount}
            ownedCount={owned.length}
          />
          {owned.length > 0 && (
            <section>
              <h2>Owned ({owned.length})</h2>
              <CaseGrid cases={owned} />
            </section>
          )}
          {wanted.length > 0 && (
            <section>
              <h2>Wishlist ({wanted.length})</h2>
              <CaseGrid cases={wanted} />
            </section>
          )}
        </>
      )}
    </article>
  );
}
