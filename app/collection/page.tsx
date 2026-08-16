import { Suspense } from "react";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { auth } from "../../lib/auth";
import { pool } from "../../lib/db";
import { loadCollection } from "../../lib/collectionItems";
import { collectionSignature } from "../../components/CollectionGrid";
import CollectionSections from "../../components/CollectionSections";
import CollectionFreshness from "../../components/CollectionFreshness.client";
import PublicAccessCard from "../../components/PublicAccessCard.client";

export const metadata: Metadata = {
  title: "My collection",
  robots: { index: false },
};

// Personal, per-user content — streamed behind the static shell below, so
// navigating here is instant and the grid fills in when the session and
// database reads land.
async function CollectionContent() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return (
      <p>
        Sign in with the account button in the top-right corner to start
        tracking the accessories you own — and the ones you&rsquo;re still
        hunting for.
      </p>
    );
  }

  // The owner always stays here on their editable view — the "Public access"
  // tile below carries the identity + share controls, and /collections/<handle>
  // is the read-only public mirror. Seed the tile from the user doc.
  const userId = session.user.id;
  const { rows } = await pool.query<{
    name: string | null;
    username: string | null;
    collectionPublic: boolean | null;
  }>(
    `SELECT "name", "username", "collectionPublic" FROM "user" WHERE "id" = $1`,
    [userId],
  );
  const userRow = rows[0];
  const profile = {
    name: typeof userRow?.name === "string" ? userRow.name : "",
    username: typeof userRow?.username === "string" ? userRow.username : null,
    collectionPublic: userRow?.collectionPublic === true,
  };

  const { owned, wanted, deviceGroups, unassigned } =
    await loadCollection(userId);
  const signature = collectionSignature(deviceGroups, unassigned, wanted);

  return (
    <>
      <CollectionFreshness signature={signature} />
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
    </>
  );
}

export default function CollectionPage() {
  return (
    // Personal + noindex — never index a collection in Pagefind search.
    <article data-pagefind-ignore>
      <h1>My collection</h1>
      <Suspense>
        <CollectionContent />
      </Suspense>
    </article>
  );
}
