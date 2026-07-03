import Link from "next/link";
import type { AnchorHTMLAttributes, ComponentProps, ReactNode } from "react";
import type { MdxComponent, MdxComponentMap } from "../lib/notes";
import { LinkArrowIcon, InfoIcon } from "./icons";
import chrome from "../styles/Chrome.module.css";

function Callout({ children }: { children?: ReactNode }) {
  return (
    <div className={chrome.callout}>
      <span className={chrome.calloutIcon} aria-hidden="true">
        <InfoIcon />
      </span>
      <div>{children}</div>
    </div>
  );
}

// Links get the trailing arrow except pure hash anchors, matching the old
// site-wide MDX link styling. Internal absolute paths navigate client-side
// via next/link; relative and external ones stay plain anchors.
function ArrowLink({
  href = "",
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const external = /^https?:\/\//.test(href);
  const showArrow = href && !href.startsWith("#");
  const inner = (
    <span className="mdx-link-inner">
      {children}
      {showArrow && <LinkArrowIcon className="mdx-link-arrow" height="1em" />}
    </span>
  );
  if (href.startsWith("/")) {
    return (
      <Link href={href} {...props}>
        {inner}
      </Link>
    );
  }
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      {...props}
    >
      {inner}
    </a>
  );
}

// Pagefind: the H1 is the page's meta title but must not be indexed as body
// content, otherwise every excerpt starts by repeating the title.
function PagefindH1(props: ComponentProps<"h1">) {
  return <h1 data-pagefind-ignore data-pagefind-meta="title" {...props} />;
}

export const mdxComponents: MdxComponentMap = {
  a: ArrowLink,
  h1: PagefindH1,
  Callout,
};

/** Renders a compiled notes/prose component with the site's MDX components. */
export default function MdxContent({
  Content,
  components,
}: {
  Content?: MdxComponent | null;
  components?: MdxComponentMap;
}) {
  if (!Content) return null;
  return <Content components={{ ...mdxComponents, ...components }} />;
}
