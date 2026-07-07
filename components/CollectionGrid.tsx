import { Fragment } from "react";
import Link from "next/link";
import type { CaseRecord } from "../lib/getCasesFromCSV";
import type { DeviceGroup } from "../lib/collectionItems";
import {
  deviceThumbnail,
  getAllDevices,
  getCompatibleDevices,
} from "../lib/devices";
import { CURRENCIES, type Currency } from "../lib/currencies";
import { getCaseName } from "../lib/caseName";
import CaseImage from "./CaseImage.client";
import DeviceActions, { type DeviceVariant } from "./DeviceActions.client";
import LinkCaseButton from "./LinkCaseButton.client";
import RemoveCaseButton from "./RemoveCaseButton.client";
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
    <article className={`${carousel.caseCard} ${device.tile}`}>
      <Link
        href={`/case/${item.SKU}`}
        className={carousel.cardLink}
        aria-label={name}
      >
        <div className={carousel.imageShell}>
          <CaseImage code={(item.alt_thumbnail || item.SKU).trim()} alt={name} />
        </div>
        <strong className={`${carousel.caseTitle} ${carousel.linkTitle}`}>
          {title ?? name}
        </strong>
      </Link>
      {(canRemove || linkOptions.length > 0) && (
        <div className={device.tileActions}>
          {linkOptions.length > 0 && (
            <LinkCaseButton label={name} options={linkOptions} />
          )}
          {canRemove && <RemoveCaseButton sku={item.SKU} label={name} />}
        </div>
      )}
    </article>
  );
}

/** The owned/wishlist card grid, shared by /collection and /collections/[username]. */
export function CaseGrid({
  cases,
  canRemove = false,
  canLink = false,
}: {
  cases: CaseRecord[];
  canRemove?: boolean;
  /** Offer "Link" on each case that has compatible devices (unlinked section). */
  canLink?: boolean;
}) {
  // `standalone` supplies the breathing room a tab bar would otherwise add
  // between the section heading and the grid.
  return (
    <div className={`${carousel.cardTrack} ${carousel.standalone}`}>
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

// Stand-in artwork for devices without an image yet.
const PhoneSymbol = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.1"
    strokeLinecap="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="6.75" y="2.75" width="10.5" height="18.5" rx="2.6" />
    <line x1="10.6" y1="18.7" x2="13.4" y2="18.7" />
  </svg>
);

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
        const label = record.colour
          ? `${record.model} — ${record.colour}`
          : record.model;
        const artwork = deviceThumbnail(record);
        return (
          <Fragment key={record.deviceId}>
          {index > 0 && <hr />}
          <div className={`${carousel.cardTrack} ${carousel.standalone}`}>
            <article className={`${carousel.caseCard} ${device.tile}`}>
              <div className={device.deviceCardBody}>
                <div className={carousel.imageShell}>
                  {artwork ? (
                    <CaseImage code={artwork} alt={label} />
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
                    variants={variantsFor(record.model)}
                  />
                )}
              </div>
            </article>
            {cases.map((item) => (
              <CollectionCaseCard
                key={item.SKU}
                item={item}
                canRemove={canRemove}
                // "Clear Case" comes in colour "Clear" — don't say it twice.
                title={
                  item.colour && !item.kind.includes(item.colour)
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
