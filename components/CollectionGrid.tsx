import { Fragment } from "react";
import Link from "next/link";
import { colourVariantCount, type CaseRecord } from "../lib/getCasesFromCSV";
import type { DeviceGroup } from "../lib/collectionItems";
import {
  deviceThumbnail,
  getAllDevices,
  getCompatibleDevices,
} from "../lib/devices";
import { CURRENCIES, type Currency } from "../lib/currencies";
import { getCaseName } from "../lib/caseName";
import CaseImage from "./CaseImage.client";
import CollectionCaseTile from "./CollectionCaseTile.client";
import DeviceActions, { type DeviceVariant } from "./DeviceActions.client";
import { PhoneSymbol } from "./icons";
import carousel from "../styles/VerticalCarousel.module.css";
import device from "../styles/DeviceSection.module.css";

// One collection case card. `title` overrides the displayed name (device
// groups show the short "kind — colour" form); the aria-label keeps the
// full name either way. `canLink` (unlinked owned cases, owner's view)
// offers the device window — but only when the catalogue actually has
// devices this case fits.
function CollectionCaseCard({
  item,
  title,
  canRemove = false,
  canLink = false,
}: {
  item: CaseRecord;
  title?: string;
  canRemove?: boolean;
  canLink?: boolean;
}) {
  const name = getCaseName(item);
  const linkOptions = canLink
    ? getCompatibleDevices(item.model).map((record) => ({
        deviceId: record.deviceId,
        model: record.model,
        colour: record.colour,
        thumbnail: deviceThumbnail(record),
      }))
    : [];
  return (
    <CollectionCaseTile
      sku={item.SKU}
      label={name}
      canRemove={canRemove}
      linkOptions={linkOptions}
    >
      <Link
        href={`/case/${item.SKU}`}
        className={carousel.cardLink}
        aria-label={name}
      >
        <div className={carousel.imageShell}>
          <CaseImage
            code={(item.alt_thumbnail || item.SKU).trim()}
            alt={name}
            lazy
          />
        </div>
        <strong className={`${carousel.caseTitle} ${carousel.linkTitle}`}>
          {title ?? name}
        </strong>
      </Link>
    </CollectionCaseTile>
  );
}

/** The owned/wishlist card grid, shared by /collection and /collections/[username]. */
export function CaseGrid({
  cases,
  canRemove = false,
  canLink = false,
  anchorId,
}: {
  cases: CaseRecord[];
  canRemove?: boolean;
  /** Offer "Link" on each case that has compatible devices (unlinked section). */
  canLink?: boolean;
  /** Scroll-restoration anchor id for this whole section (see CollectionFreshness). */
  anchorId?: string;
}) {
  // `standalone` supplies the breathing room a tab bar would otherwise add
  // between the section heading and the grid.
  return (
    <div
      className={`${carousel.cardTrack} ${carousel.standalone}`}
      data-collection-anchor={anchorId}
    >
      {cases.map((item) => (
        <CollectionCaseCard
          key={item.SKU}
          item={item}
          canRemove={canRemove}
          canLink={canLink}
        />
      ))}
    </div>
  );
}

/**
 * Owned devices with their cases, shared by /collection and
 * /collections/[username]. Each device is one card track: the device tile
 * first, then its cases with short "kind — colour" titles (the device tile
 * already says which model they're for). `canRemove` (the owner's view)
 * adds remove/change-colour controls.
 */
export function DeviceSections({
  groups,
  canRemove = false,
}: {
  groups: DeviceGroup[];
  canRemove?: boolean;
}) {
  // Colour variants per model, for the owner's "Change colour" window.
  const variantsFor = (model: string): DeviceVariant[] =>
    getAllDevices()
      .filter((record) => record.model === model)
      .map((record) => ({
        deviceId: record.deviceId,
        colour: record.colour,
        thumbnail: deviceThumbnail(record),
      }));

  return (
    <>
      {groups.map(({ device: record, cases, implicit }, index) => {
        const variants = variantsFor(record.model);
        // A colour distinguishes nothing when the model only comes in one
        // (AirTag, Apple Pencil) — show just the name.
        const label =
          record.colour && variants.length > 1
            ? `${record.model} — ${record.colour}`
            : record.model;
        const artwork = deviceThumbnail(record);
        return (
          <Fragment key={record.deviceId}>
          {index > 0 && <hr />}
          <div
            className={`${carousel.cardTrack} ${carousel.standalone}`}
            data-collection-anchor={record.deviceId}
          >
            <article className={`${carousel.caseCard} ${device.tile}`}>
              <div className={device.deviceCardBody}>
                <div className={carousel.imageShell}>
                  {artwork ? (
                    <CaseImage code={artwork} alt={label} lazy />
                  ) : (
                    <PhoneSymbol className={device.placeholder} />
                  )}
                </div>
                <strong
                  className={`${carousel.caseTitle} ${carousel.linkTitle}`}
                >
                  {label}
                </strong>
                {/* Implicit groups are derived, not owned — nothing to
                    remove or recolour. */}
                {canRemove && !implicit && (
                  <DeviceActions
                    deviceId={record.deviceId}
                    label={label}
                    model={record.model}
                    variants={variants}
                  />
                )}
              </div>
            </article>
            {cases.map((item) => (
              <CollectionCaseCard
                key={item.SKU}
                item={item}
                canRemove={canRemove}
                // Append the colour only when it distinguishes something: skip
                // it for one-colour products (MagSafe Battery Pack, a Smart
                // Keyboard) and for "Clear Case" (colour "Clear" — don't say it
                // twice).
                title={
                  item.colour &&
                  !item.kind.includes(item.colour) &&
                  colourVariantCount(item.model, item.kind) > 1
                    ? `${item.kind} — ${item.colour}`
                    : item.kind
                }
              />
            ))}
          </div>
          </Fragment>
        );
      })}
    </>
  );
}

/**
 * A compact fingerprint of everything the grid renders — each device group
 * (id + its cases), the unassigned cases, and the wishlist. It changes on any
 * add / remove / relink / recolour, letting CollectionFreshness tell when a
 * router.refresh() has actually brought new data in.
 */
export function collectionSignature(
  deviceGroups: DeviceGroup[],
  unassigned: CaseRecord[],
  wanted: CaseRecord[],
): string {
  const groups = deviceGroups
    .map((g) => `${g.device.deviceId}:${g.cases.map((c) => c.SKU).join(",")}`)
    .join("|");
  const skus = (cases: CaseRecord[]) => cases.map((c) => c.SKU).join(",");
  return `${groups}#u:${skus(unassigned)}#w:${skus(wanted)}`;
}

export interface LaunchValue {
  sums: Partial<Record<Currency, number>>;
  /** Cases with a known USD launch price. */
  pricedCount: number;
}

export function computeLaunchValue(cases: CaseRecord[]): LaunchValue {
  const sums: Partial<Record<Currency, number>> = {};
  let pricedCount = 0;
  for (const item of cases) {
    if (item.prices.USD) pricedCount += 1;
    for (const code of CURRENCIES) {
      const amount = Number(item.prices[code]);
      if (item.prices[code] && Number.isFinite(amount)) {
        sums[code] = (sums[code] ?? 0) + amount;
      }
    }
  }
  return { sums, pricedCount };
}
