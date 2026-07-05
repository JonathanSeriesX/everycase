import { headers } from "next/headers";
import type { Metadata } from "next";
import { auth } from "../../lib/auth";
import { loadCollection } from "../../lib/collectionItems";
import {
  CaseGrid,
  computeLaunchValue,
} from "../../components/CollectionGrid";
import CollectionValue from "../../components/CollectionValue.client";

// Personal, per-user page — always rendered on demand, never cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your collection",
  robots: { index: false },
};

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

  const { owned, wanted } = await loadCollection(session.user.id);
  const { sums, pricedCount } = computeLaunchValue(owned);

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
