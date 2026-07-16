import { headers } from "next/headers";
import type { Metadata } from "next";
import { ObjectId } from "mongodb";
import { auth } from "../../lib/auth";
import { db } from "../../lib/mongo";
import { loadCollection } from "../../lib/collectionItems";
import { collectionSignature } from "../../components/CollectionGrid";
import CollectionSections from "../../components/CollectionSections";
import CollectionFreshness from "../../components/CollectionFreshness.client";
import PublicAccessCard from "../../components/PublicAccessCard.client";

// Personal, per-user page — always rendered on demand, never cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My collection",
  robots: { index: false },
};

export default async function CollectionPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return (
      <article>
        <h1>My collection</h1>
        <p>
          Sign in with the account button in the top-right corner to start
          tracking the accessories you own — and the ones you&rsquo;re still
          hunting for.
        </p>
      </article>
    );
  }

  // The owner always stays here on their editable view — the "Public access"
  // tile below carries the identity + share controls, and /collections/<handle>
  // is the read-only public mirror. Seed the tile from the user doc.
  const userId = session.user.id;
  const userDoc = await db
    .collection("user")
    .findOne(
      ObjectId.isValid(userId) ? { _id: new ObjectId(userId) } : { id: userId },
    );
  const profile = {
    name: typeof userDoc?.name === "string" ? userDoc.name : "",
    username: typeof userDoc?.username === "string" ? userDoc.username : null,
    collectionPublic: userDoc?.collectionPublic === true,
  };

  const { owned, wanted, deviceGroups, unassigned } =
    await loadCollection(userId);
  const signature = collectionSignature(deviceGroups, unassigned, wanted);

  return (
    // Personal + noindex — never index a collection in Pagefind search.
    <article data-pagefind-ignore>
      <CollectionFreshness signature={signature} />
      <h1>My collection</h1>
      <PublicAccessCard initial={profile} />
      {owned.length === 0 &&
      wanted.length === 0 &&
      deviceGroups.length === 0 ? (
        <p>
          Nothing here yet. Open any case page and tap <strong>I own it</strong>{" "}
          or <strong>I want it</strong> — it shows up here.
        </p>
      ) : (
        <CollectionSections
          owned={owned}
          wanted={wanted}
          deviceGroups={deviceGroups}
          unassigned={unassigned}
          canEdit
        />
      )}
    </article>
  );
}
