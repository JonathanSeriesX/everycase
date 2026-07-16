import type { CaseRecord } from "../lib/getCasesFromCSV";
import type { DeviceGroup } from "../lib/collectionItems";
import {
  CaseGrid,
  DeviceSections,
  computeLaunchValue,
} from "./CollectionGrid";
import CollectionHead from "./CollectionHead";
import CollectionStats from "./CollectionStats";

/**
 * The body shared by /collection (the owner's editable view, canEdit) and
 * /collections/[username] (the read-only public mirror): the stats tile,
 * device groups with their cases, the unassigned grid, and the wishlist.
 * Callers keep their own H1 and empty-state copy.
 *
 * Only the public page eager-loads its first row of images: on the owner's
 * view the Public-access tile sits above the grid, so nothing here is the
 * LCP candidate.
 */
export default function CollectionSections({
  owned,
  wanted,
  deviceGroups,
  unassigned,
  canEdit = false,
}: {
  owned: CaseRecord[];
  wanted: CaseRecord[];
  deviceGroups: DeviceGroup[];
  unassigned: CaseRecord[];
  /** The owner's view: remove/link/recolour controls on every tile. */
  canEdit?: boolean;
}) {
  const { sums, pricedCount } = computeLaunchValue(owned);

  return (
    <>
      {(owned.length > 0 || deviceGroups.length > 0) && (
        <section>
          <CollectionStats
            // Implicit groups (AirTag, MagSafe Accessories, …) are derived
            // homes for cases, not devices the owner declared.
            deviceCount={deviceGroups.filter((g) => !g.implicit).length}
            caseCount={owned.length}
            sums={sums}
            pricedCount={pricedCount}
          />
          <hr />
          <DeviceSections groups={deviceGroups} canRemove={canEdit} />
          {unassigned.length > 0 && deviceGroups.length > 0 && (
            <h3>Not linked to a device</h3>
          )}
          {unassigned.length > 0 && (
            <CaseGrid
              cases={unassigned}
              canRemove={canEdit}
              canLink={canEdit}
              anchorId="section:unassigned"
              // First content only when there are no device sections above.
              priorityCount={!canEdit && deviceGroups.length === 0 ? 4 : 0}
            />
          )}
        </section>
      )}
      {wanted.length > 0 && (
        <section>
          <CollectionHead title="Wishlist" caseCount={wanted.length} />
          <CaseGrid
            cases={wanted}
            canRemove={canEdit}
            anchorId="section:wishlist"
            // First content only when nothing owned renders above it.
            priorityCount={
              !canEdit && owned.length === 0 && deviceGroups.length === 0
                ? 4
                : 0
            }
          />
        </section>
      )}
    </>
  );
}
