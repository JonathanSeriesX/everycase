import Link from "next/link";
import { ChevronRightIcon } from "./icons";
import chrome from "../styles/Chrome.module.css";

/**
 * The drill-down trail: Home › iPhone › iPhone 16, Plus, Pro, Max.
 * `trail` is [{ href, title }...]; the last entry is the current page and
 * renders as plain text.
 */
export default function Breadcrumb({ trail }) {
  if (!trail || trail.length === 0) return null;
  const crumbs = [{ href: "/", title: "Home" }, ...trail];
  return (
    <nav aria-label="Breadcrumb" className={chrome.breadcrumb}>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={crumb.href ?? crumb.title} className={chrome.breadcrumb}>
            {isLast ? (
              <span className={chrome.breadcrumbCurrent}>{crumb.title}</span>
            ) : (
              <>
                <Link href={crumb.href} className={chrome.breadcrumbLink}>
                  {crumb.title}
                </Link>
                <span className={chrome.breadcrumbSep} aria-hidden="true">
                  <ChevronRightIcon />
                </span>
              </>
            )}
          </span>
        );
      })}
    </nav>
  );
}
