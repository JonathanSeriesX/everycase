import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ObjectId } from "mongodb";
import { auth } from "../../lib/auth";
import { db } from "../../lib/mongo";
import { loadCollection } from "../../lib/collectionItems";
import {
  CaseGrid,
  DeviceSections,
  collectionSignature,
  computeLaunchValue,
} from "../../components/CollectionGrid";
import CollectionHead from "../../components/CollectionHead";
import CollectionStats from "../../components/CollectionStats";
import CollectionFreshness from "../../components/CollectionFreshness.client";

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

  // A public collection has a nicer address — send its owner there.
  const userId = session.user.id;
  const userDoc = await db
    .collection("user")
    .findOne(
      ObjectId.isValid(userId) ? { _id: new ObjectId(userId) } : { id: userId },
    );
  if (userDoc?.collectionPublic === true && typeof userDoc.username === "string") {
    redirect(`/collections/${userDoc.username}`);
  }

  const { owned, wanted, deviceGroups, unassigned } =
    await loadCollection(userId);
  const { sums, pricedCount } = computeLaunchValue(owned);
  const signature = collectionSignature(deviceGroups, unassigned, wanted);

  return (
    // Personal + noindex — never index a collection in Pagefind search.
    <article data-pagefind-ignore>
      <CollectionFreshness signature={signature} />
      <h1>Your collection</h1>
      {owned.length === 0 && wanted.length === 0 && deviceGroups.length === 0 ? (
        <p>
          Nothing here yet. Open any case page and tap{" "}
          <strong>I own it</strong> or <strong>I want it</strong> — it shows
          up here.
        </p>
      ) : (
        <>
          {(owned.length > 0 || deviceGroups.length > 0) && (
            <section>
              <CollectionStats
                // Implicit groups (AirTag, MagSafe Accessories, …) are
                // derived homes for cases, not devices the user declared.
                deviceCount={deviceGroups.filter((g) => !g.implicit).length}
                caseCount={owned.length}
                sums={sums}
                pricedCount={pricedCount}
              />
              <hr />
              <DeviceSections groups={deviceGroups} canRemove />
              {unassigned.length > 0 && deviceGroups.length > 0 && (
                <h3>Not linked to a device</h3>
              )}
              {unassigned.length > 0 && (
                <CaseGrid
                  cases={unassigned}
                  canRemove
                  canLink
                  anchorId="section:unassigned"
                />
              )}
            </section>
          )}
          {wanted.length > 0 && (
            <section>
              <CollectionHead title="Wishlist" caseCount={wanted.length} />
              <CaseGrid cases={wanted} canRemove anchorId="section:wishlist" />
            </section>
          )}
        </>
      )}
    </article>
  );
}
