import { cache, Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import { pool } from "../../../lib/db";
import { loadCollection } from "../../../lib/collectionItems";
import {
  buildCollectionStats,
  computeLaunchValue,
} from "../../../lib/collectionStats";
import CollectionSections from "../../../components/CollectionSections";

// Public, per-user page — the body streams behind a Suspense shell so it
// always reflects the owner's latest items and privacy setting.

interface CollectionsRouteProps {
  params: Promise<{ username: string }>;
}

interface PublicOwner {
  id: string;
  name: string | null;
  username: string;
}

// Request-cached: generateMetadata and the page share one lookup.
const findPublicOwner = cache(
  async (username: string): Promise<PublicOwner | null> => {
    if (!/^[a-z0-9][a-z0-9_-]{2,19}$/.test(username)) return null;
    const { rows } = await pool.query<PublicOwner>(
      `SELECT "id", "name", "username" FROM "user"
       WHERE "username" = $1 AND "collectionPublic" = true`,
      [username],
    );
    return rows[0] ?? null;
  },
);

const displayName = (owner: PublicOwner): string =>
  (typeof owner.name === "string" && owner.name.trim()) || owner.username;

/** The header pills as prose — "3 devices • 5 accessories • worth $X at
 * launch • 2 items wishlisted" — for meta descriptions. Empty when the
 * collection is. */
async function collectionSummary(ownerId: string): Promise<string> {
  const { owned, wanted, deviceGroups } = await loadCollection(ownerId);
  const { totalUSD, pricedCount } = computeLaunchValue(owned);
  const parts = buildCollectionStats({
    deviceCount: deviceGroups.filter((group) => !group.implicit).length,
    caseCount: owned.length,
    totalUSD,
    pricedCount,
  }).map((stat) => stat.label);
  if (wanted.length > 0) {
    parts.push(
      `${wanted.length} item${wanted.length === 1 ? "" : "s"} wishlisted`,
    );
  }
  return parts.join(" • ");
}

export async function generateMetadata(
  { params }: CollectionsRouteProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { username } = await params;
  const owner = await findPublicOwner(username.toLowerCase());
  if (!owner) notFound();
  const title = `${displayName(owner)}’s collection`;
  // The header pills, not the site's generic line — an empty collection
  // falls back to the inherited description.
  const summary = await collectionSummary(owner.id);
  // Setting openGraph replaces the layout's whole object, so carry the
  // inherited bits over alongside the page title (matches the H1).
  const parentMetadata = await parent;
  return {
    title,
    ...(summary ? { description: summary } : {}),
    openGraph: {
      // Absolute: matches the H1 exactly — cards show the site name via
      // og:site_name already, no "— Finest Woven" suffix needed.
      title: { absolute: title },
      ...(summary ? { description: summary } : {}),
      siteName: parentMetadata.openGraph?.siteName,
      locale: parentMetadata.openGraph?.locale,
      type: "website",
      images: parentMetadata.openGraph?.images,
    },
  };
}

async function PublicCollection({ params }: CollectionsRouteProps) {
  const { username } = await params;
  const owner = await findPublicOwner(username.toLowerCase());
  if (!owner) return notFound();

  // This page is read-only for everyone, owner included — no remove/link/
  // recolour controls. Owners edit on /collection.
  const { owned, wanted, deviceGroups, unassigned } = await loadCollection(
    owner.id,
  );

  return (
    <>
      <h1>{displayName(owner)}’s collection</h1>
      {owned.length === 0 &&
      wanted.length === 0 &&
      deviceGroups.length === 0 ? (
        <p>Nothing here yet.</p>
      ) : (
        <CollectionSections
          owned={owned}
          wanted={wanted}
          deviceGroups={deviceGroups}
          unassigned={unassigned}
        />
      )}
    </>
  );
}

export default function PublicCollectionPage({
  params,
}: CollectionsRouteProps) {
  return (
    // Public collections may be indexed by search engines, but keep them out
    // of the site's Pagefind search index.
    <article data-pagefind-ignore>
      <Suspense>
        <PublicCollection params={params} />
      </Suspense>
    </article>
  );
}
