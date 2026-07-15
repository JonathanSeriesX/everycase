import { Fragment } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "./icons";
import chrome from "../styles/Chrome.module.css";

export interface Crumb {
  href: string;
  title: string;
}

/**
 * The drill-down trail: Home › iPhone › — the current page is implied by the
 * H1 right below, so its crumb is dropped and the trail ends on a chevron.
 * `trail` is [{ href, title }...]; the last entry (the current page) only
 * contributes to what comes before it.
 */
export default function Breadcrumb({ trail }: { trail?: Crumb[] }) {
  if (!trail || trail.length === 0) return null;
  const crumbs = [{ href: "/", title: "Home" }, ...trail].slice(0, -1);
  return (
    <nav aria-label="Breadcrumb" className={chrome.breadcrumb}>
      {/* Spaces between crumbs are for text scrapers, which glue adjacent
          inline tags ("HomeiPhone"); the flex layout ignores them. */}
      {crumbs.map((crumb) => (
        <Fragment key={crumb.href}>
          <span className={chrome.breadcrumbItem}>
            <Link href={crumb.href} className={chrome.breadcrumbLink}>
              {crumb.title}
            </Link>
            <span className={chrome.breadcrumbSep} aria-hidden="true">
              <ChevronRightIcon />
            </span>
          </span>{" "}
        </Fragment>
      ))}
    </nav>
  );
}
