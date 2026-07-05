import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Document } from "mongodb";
import { db } from "../../../lib/mongo";
import { loadCollection } from "../../../lib/collectionItems";
import {
  CaseGrid,
  computeLaunchValue,
} from "../../../components/CollectionGrid";
import CollectionValue from "../../../components/CollectionValue.client";

// Public, per-user page — rendered on demand so it always reflects the
// owner's latest items and privacy setting.
export const dynamic = "force-dynamic";

interface CollectionsRouteProps {
  params: Promise<{ username: string }>;
}

async function findPublicOwner(username: string): Promise<Document | null> {
  if (!/^[a-z0-9][a-z0-9_-]{2,19}$/.test(username)) return null;
  const owner = await db.collection("user").findOne({ username });
  return owner?.collectionPublic === true ? owner : null;
}

const displayName = (owner: Document): string =>
  (typeof owner.name === "string" && owner.name.trim()) || owner.username;

export async function generateMetadata({
  params,
}: CollectionsRouteProps): Promise<Metadata> {
  const { username } = await params;
  const owner = await findPublicOwner(username.toLowerCase());
  if (!owner) return {};
  return { title: `${displayName(owner)}’s collection` };
}

export default async function PublicCollectionPage({
  params,
}: CollectionsRouteProps) {
  const { username } = await params;
  const owner = await findPublicOwner(username.toLowerCase());
  if (!owner) return notFound();

  const { owned, wanted } = await loadCollection(owner._id.toString());
  const { sums, pricedCount } = computeLaunchValue(owned);

  return (
    <article>
      <h1>{displayName(owner)}’s collection</h1>
      {owned.length === 0 && wanted.length === 0 ? (
        <p>Nothing here yet.</p>
      ) : (
        <>
          <CollectionValue
            sums={sums}
            pricedCount={pricedCount}
            ownedCount={owned.length}
            label="Launch value of this collection"
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
