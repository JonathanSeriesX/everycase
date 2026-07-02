import Link from "next/link";
import { ChevronRightIcon } from "./icons";
import chrome from "../styles/Chrome.module.css";

/**
 * The drill-down trail: Home › iPhone › — the current page is implied by the
 * H1 right below, so its crumb is dropped and the trail ends on a chevron.
 * `trail` is [{ href, title }...]; the last entry (the current page) only
 * contributes to what comes before it.
 */
export default function Breadcrumb({ trail }) {
  if (!trail || trail.length === 0) return null;
  const crumbs = [{ href: "/", title: "Home" }, ...trail].slice(0, -1);
  return (
    <nav aria-label="Breadcrumb" className={chrome.breadcrumb}>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className={chrome.breadcrumb}>
          <Link href={crumb.href} className={chrome.breadcrumbLink}>
            {crumb.title}
          </Link>
          <span className={chrome.breadcrumbSep} aria-hidden="true">
            <ChevronRightIcon />
          </span>
        </span>
      ))}
    </nav>
  );
}
