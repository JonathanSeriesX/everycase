import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata, ResolvingMetadata } from "next";
import type { Document } from "mongodb";
import { auth } from "../../../lib/auth";
import { db } from "../../../lib/mongo";
import { loadCollection } from "../../../lib/collectionItems";
import {
  CaseGrid,
  DeviceSections,
  computeLaunchValue,
} from "../../../components/CollectionGrid";
import CollectionHead from "../../../components/CollectionHead";
import RefreshOnRestore from "../../../components/RefreshOnRestore.client";

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

export async function generateMetadata(
  { params }: CollectionsRouteProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { username } = await params;
  const owner = await findPublicOwner(username.toLowerCase());
  if (!owner) return {};
  const title = `${displayName(owner)}’s collection`;
  // Setting openGraph replaces the layout's whole object, so carry the
  // inherited bits over alongside the page title (matches the H1).
  const parentMetadata = await parent;
  return {
    title,
    openGraph: {
      // Absolute: matches the H1 exactly — cards show the site name via
      // og:site_name already, no "— Finest Woven" suffix needed.
      title: { absolute: title },
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

  // /collection redirects public owners here — this is also THEIR view, so
  // they keep their remove/change-colour controls. Everyone else is a guest.
  const session = await auth.api.getSession({ headers: await headers() });
  const isOwner = session?.user.id === owner._id.toString();

  const { owned, wanted, deviceGroups, unassigned } = await loadCollection(
    owner._id.toString(),
  );
  const { sums, pricedCount } = computeLaunchValue(owned);

  return (
    <article>
      {isOwner && <RefreshOnRestore />}
      <h1>{displayName(owner)}’s collection</h1>
      {owned.length === 0 && wanted.length === 0 && deviceGroups.length === 0 ? (
        <p>Nothing here yet.</p>
      ) : (
        <>
          {(owned.length > 0 || deviceGroups.length > 0) && (
            <section>
              <CollectionHead
                title="Owned"
                // Implicit groups (AirTag, MagSafe Accessories, …) are
                // derived homes for cases, not devices the owner declared.
                deviceCount={deviceGroups.filter((g) => !g.implicit).length}
                caseCount={owned.length}
                sums={sums}
                pricedCount={pricedCount}
              />
              <DeviceSections groups={deviceGroups} canRemove={isOwner} />
              {unassigned.length > 0 && deviceGroups.length > 0 && (
                <h3>Not linked to a device</h3>
              )}
              {unassigned.length > 0 && (
                <CaseGrid cases={unassigned} canRemove={isOwner} canLink={isOwner} />
              )}
            </section>
          )}
          {wanted.length > 0 && (
            <section>
              <CollectionHead title="Wishlist" caseCount={wanted.length} />
              <CaseGrid cases={wanted} canRemove={isOwner} />
            </section>
          )}
        </>
      )}
    </article>
  );
}
