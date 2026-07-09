import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import type { Document } from "mongodb";
import { db } from "../../../lib/mongo";
import { loadCollection } from "../../../lib/collectionItems";
import { formatPrice } from "../../../lib/currencies";
import {
  CaseGrid,
  DeviceSections,
  computeLaunchValue,
} from "../../../components/CollectionGrid";
import CollectionHead from "../../../components/CollectionHead";
import CollectionStats from "../../../components/CollectionStats";

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
  const { sums } = computeLaunchValue(owned);
  const parts: string[] = [];
  const deviceCount = deviceGroups.filter((group) => !group.implicit).length;
  if (deviceCount > 0) {
    parts.push(`${deviceCount} device${deviceCount === 1 ? "" : "s"}`);
  }
  if (owned.length > 0) {
    parts.push(`${owned.length} accessor${owned.length === 1 ? "y" : "ies"}`);
  }
  const worth = sums.USD ? formatPrice(sums.USD, "USD") : "";
  if (worth) parts.push(`worth ${worth} at launch`);
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
  const { sums, pricedCount } = computeLaunchValue(owned);

  return (
    // Collections are personal, ever-changing, and noindex — keep them out of
    // the Pagefind search index entirely.
    <article data-pagefind-ignore>
      <h1>{displayName(owner)}’s collection</h1>
      {owned.length === 0 && wanted.length === 0 && deviceGroups.length === 0 ? (
        <p>Nothing here yet.</p>
      ) : (
        <>
          {(owned.length > 0 || deviceGroups.length > 0) && (
            <section>
              <CollectionStats
                // Implicit groups (AirTag, MagSafe Accessories, …) are
                // derived homes for cases, not devices the owner declared.
                deviceCount={deviceGroups.filter((g) => !g.implicit).length}
                caseCount={owned.length}
                sums={sums}
                pricedCount={pricedCount}
              />
              <hr />
              <DeviceSections groups={deviceGroups} />
              {unassigned.length > 0 && deviceGroups.length > 0 && (
                <h3>Not linked to a device</h3>
              )}
              {unassigned.length > 0 && (
                <CaseGrid
                  cases={unassigned}
                  anchorId="section:unassigned"
                  // First content only when there are no device sections above.
                  priorityCount={deviceGroups.length === 0 ? 4 : 0}
                />
              )}
            </section>
          )}
          {wanted.length > 0 && (
            <section>
              <CollectionHead title="Wishlist" caseCount={wanted.length} />
              <CaseGrid
                cases={wanted}
                anchorId="section:wishlist"
                // First content only when nothing owned renders above it.
                priorityCount={
                  owned.length === 0 && deviceGroups.length === 0 ? 4 : 0
                }
              />
            </section>
          )}
        </>
      )}
    </article>
  );
}
