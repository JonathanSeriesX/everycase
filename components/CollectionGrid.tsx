import { Fragment } from "react";
import Link from "next/link";
import { colourVariantCount, type CaseRecord } from "../lib/getCasesFromCSV";
import type { DeviceGroup } from "../lib/collectionItems";
import { devicePagePath } from "../lib/catalogue";
import {
  deviceThumbnail,
  displayModelName,
  getAllDevices,
  getCompatibleDevices,
} from "../lib/devices";
import { CURRENCIES, type Currency } from "../lib/currencies";
import { getCaseName } from "../lib/caseName";
import { imageForColour } from "../lib/images";
import CaseImage from "./CaseImage.client";
import CollectionCaseTile from "./CollectionCaseTile.client";
import DeviceActions, { type DeviceVariant } from "./DeviceActions.client";
import { PhoneSymbol } from "./icons";
import carousel from "../styles/VerticalCarousel.module.css";
import device from "../styles/DeviceSection.module.css";

// Collection-only display overrides for a few verbose accessory kinds. Only the
// short title under a device group is affected — case pages and search keep the
// full CSV name ("iPhone Lightning Dock — …").
const COLLECTION_KIND_LABELS: Record<string, string> = {
  "iPhone Lightning Dock": "Lightning Dock",
};

// Render a case-card title with each " — " segment on its own centred line —
// "Silicone Case" / "Pink Pomelo" instead of "Silicone Case — Pink Pomelo".
// Titles without the separator (single-colour products, "Clear Case") stay on
// one line. The full name still rides on the Link's aria-label for screen
// readers, so dropping the dash is purely visual.
function titleLines(text: string) {
  return text.split(" — ").map((segment, index) => (
    <Fragment key={index}>
      {index > 0 && <br />}
      {segment}
    </Fragment>
  ));
}

// One collection case card. `title` overrides the displayed name (device
// groups show the short "kind — colour" form); the aria-label keeps the
// full name either way. `canLink` (unlinked owned cases, owner's view)
// offers the device window — but only when the catalogue actually has
// devices this case fits. `deviceColour` (cases nested under a device) swaps
// the thumbnail to the photo whose pictured device matches that colour, when
// one has been tagged in images.csv.
function CollectionCaseCard({
  item,
  title,
  deviceColour,
  canRemove = false,
  canLink = false,
  priority = false,
}: {
  item: CaseRecord;
  title?: string;
  deviceColour?: string;
  canRemove?: boolean;
  canLink?: boolean;
  /** Above-the-fold card: load its image eagerly at high priority for LCP,
   * instead of the grid's default native lazy-loading. */
  priority?: boolean;
}) {
  const name = getCaseName(item);
  const code = (
    (deviceColour && imageForColour(item.SKU, deviceColour)) ||
    item.alt_thumbnail ||
    item.SKU
  ).trim();
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
          {priority ? (
            <CaseImage code={code} alt={name} priority />
          ) : (
            <CaseImage code={code} alt={name} lazy />
          )}
        </div>
        <strong className={`${carousel.caseTitle} ${carousel.linkTitle}`}>
          {titleLines(title ?? name)}
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
  priorityCount = 0,
}: {
  cases: CaseRecord[];
  canRemove?: boolean;
  /** Offer "Link" on each case that has compatible devices (unlinked section). */
  canLink?: boolean;
  /** Scroll-restoration anchor id for this whole section (see CollectionFreshness). */
  anchorId?: string;
  /** Eagerly load the first N cards' images — set only when this grid is the
   * page's first content (no device sections above it). */
  priorityCount?: number;
}) {
  // `standalone` supplies the breathing room a tab bar would otherwise add
  // between the section heading and the grid.
  return (
    <div
      className={`${carousel.cardTrack} ${carousel.standalone}`}
      data-collection-anchor={anchorId}
    >
      {cases.map((item, index) => (
        <CollectionCaseCard
          key={item.SKU}
          item={item}
          canRemove={canRemove}
          canLink={canLink}
          priority={index < priorityCount}
        />
      ))}
    </div>
  );
}

// Colour variants per model, for the owner's "Change colour" window.
const variantsFor = (model: string): DeviceVariant[] =>
  getAllDevices()
    .filter((record) => record.model === model)
    .map((record) => ({
      deviceId: record.deviceId,
      colour: record.colour,
      thumbnail: deviceThumbnail(record),
    }));

// The short title under a device group: "kind — colour", with the colour
// dropped when it distinguishes nothing — one-colour products (MagSafe
// Battery Pack, a Smart Keyboard) and "Clear Case" (colour "Clear" — don't
// say it twice). Colour logic keys off the real kind; only the shown label
// gets the COLLECTION_KIND_LABELS override.
function shortCaseTitle(item: CaseRecord): string {
  const kindLabel = COLLECTION_KIND_LABELS[item.kind] ?? item.kind;
  return item.colour &&
    !item.kind.includes(item.colour) &&
    colourVariantCount(item.model, item.kind) > 1
    ? `${kindLabel} — ${item.colour}`
    : kindLabel;
}

// One owned-device tile: artwork (or the phone placeholder) + name, linking
// to the model's catalogue page when it has one, plus the owner's
// remove/change-colour controls.
function DeviceTile({
  record,
  implicit,
  firstGroup,
  canRemove,
}: {
  record: DeviceGroup["device"];
  implicit: boolean | undefined;
  /** First content row of the page — load the artwork eagerly for LCP. */
  firstGroup: boolean;
  canRemove: boolean;
}) {
  const variants = variantsFor(record.model);
  const modelName = displayModelName(record.model);
  const pagePath = devicePagePath(record.deviceId);
  // A colour distinguishes nothing when the model only comes in one
  // (AirTag, Apple Pencil) — show just the name.
  const label =
    record.colour && variants.length > 1
      ? `${modelName} — ${record.colour}`
      : modelName;
  const artwork = deviceThumbnail(record);

  const inner = (
    <>
      <div className={carousel.imageShell}>
        {artwork ? (
          <CaseImage
            code={artwork}
            alt={label}
            {...(firstGroup ? { priority: true } : { lazy: true })}
          />
        ) : (
          <PhoneSymbol className={device.placeholder} />
        )}
      </div>
      <strong className={`${carousel.caseTitle} ${carousel.linkTitle}`}>
        {titleLines(label)}
      </strong>
    </>
  );

  return (
    <article className={`${carousel.caseCard} ${device.tile}`}>
      <div className={device.deviceCardBody}>
        {/* Tap the tile to open the model's catalogue page (its cases). */}
        {pagePath ? (
          <Link
            href={pagePath}
            className={carousel.cardLink}
            aria-label={label}
          >
            {inner}
          </Link>
        ) : (
          inner
        )}
        {/* Implicit groups are derived, not owned — nothing to
            remove or recolour. */}
        {canRemove && !implicit && (
          <DeviceActions
            deviceId={record.deviceId}
            label={label}
            model={modelName}
            variants={variants}
          />
        )}
      </div>
    </article>
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
  return (
    <>
      {groups.map(({ device: record, cases, implicit }, index) => {
        // The first group is the page's first content row — load its device
        // tile and leading cases eagerly for LCP; everything below stays lazy.
        const firstGroup = index === 0;
        return (
          <Fragment key={record.deviceId}>
            {index > 0 && <hr />}
            <div
              className={`${carousel.cardTrack} ${carousel.standalone}`}
              data-collection-anchor={record.deviceId}
            >
              <DeviceTile
                record={record}
                implicit={implicit}
                firstGroup={firstGroup}
                canRemove={canRemove}
              />
              {cases.map((item, caseIndex) => (
                <CollectionCaseCard
                  key={item.SKU}
                  item={item}
                  canRemove={canRemove}
                  // First row: eager-load the device tile's leading cases too.
                  priority={firstGroup && caseIndex < 3}
                  // Match the case photo to the owned device's colour when a
                  // matching shot exists (falls back to the default thumbnail).
                  deviceColour={record.colour}
                  title={shortCaseTitle(item)}
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
