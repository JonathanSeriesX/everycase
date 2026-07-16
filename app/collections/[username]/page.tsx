import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import type { Document } from "mongodb";
import { db } from "../../../lib/mongo";
import { loadCollection } from "../../../lib/collectionItems";
import { buildCollectionStats } from "../../../lib/collectionStats";
import { computeLaunchValue } from "../../../components/CollectionGrid";
import CollectionSections from "../../../components/CollectionSections";

// Public, per-user page — rendered on demand so it always reflects the
// owner's latest items and privacy setting.
export const dynamic = "force-dynamic";

interface CollectionsRouteProps {
  params: Promise<{ username: string }>;
}

// Request-cached: generateMetadata and the page share one lookup.
const findPublicOwner = cache(
  async (username: string): Promise<Document | null> => {
    if (!/^[a-z0-9][a-z0-9_-]{2,19}$/.test(username)) return null;
    const owner = await db.collection("user").findOne({ username });
    return owner?.collectionPublic === true ? owner : null;
  },
);

const displayName = (owner: Document): string =>
  (typeof owner.name === "string" && owner.name.trim()) || owner.username;

/** The header pills as prose — "3 devices • 5 accessories • worth $X at
 * launch • 2 items wishlisted" — for meta descriptions. Empty when the
 * collection is. */
async function collectionSummary(ownerId: string): Promise<string> {
  const { owned, wanted, deviceGroups } = await loadCollection(ownerId);
  const { sums, pricedCount } = computeLaunchValue(owned);
  const parts = buildCollectionStats({
    deviceCount: deviceGroups.filter((group) => !group.implicit).length,
    caseCount: owned.length,
    sums,
    pricedCount,
  }).map((stat) => stat.label);
  if (wanted.length > 0) {
    parts.push(`${wanted.length} item${wanted.length === 1 ? "" : "s"} wishlisted`);
  }
  return parts.join(" • ");
}

export async function generateMetadata(
  { params }: CollectionsRouteProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { username } = await params;
  const owner = await findPublicOwner(username.toLowerCase());
  if (!owner) return {};
  const title = `${displayName(owner)}’s collection`;
  // The header pills, not the site's generic line — an empty collection
  // falls back to the inherited description.
  const summary = await collectionSummary(owner._id.toString());
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

export default async function PublicCollectionPage({
  params,
}: CollectionsRouteProps) {
  const { username } = await params;
  const owner = await findPublicOwner(username.toLowerCase());
  if (!owner) return notFound();

  // This page is read-only for everyone, owner included — no remove/link/
  // recolour controls. Owners edit on /collection.
  const { owned, wanted, deviceGroups, unassigned } = await loadCollection(
    owner._id.toString(),
  );

  return (
    // Collections are personal, ever-changing, and noindex — keep them out of
    // the Pagefind search index entirely.
    <article data-pagefind-ignore>
      <h1>{displayName(owner)}’s collection</h1>
      {owned.length === 0 && wanted.length === 0 && deviceGroups.length === 0 ? (
        <p>Nothing here yet.</p>
      ) : (
        <CollectionSections
          owned={owned}
          wanted={wanted}
          deviceGroups={deviceGroups}
          unassigned={unassigned}
        />
      )}
    </article>
  );
}
