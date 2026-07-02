import { LinkArrowIcon, InfoIcon } from "./icons";
import chrome from "../styles/Chrome.module.css";

function Callout({ children }) {
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
// site-wide MDX link styling.
function ArrowLink({ href = "", children, ...props }) {
  const external = /^https?:\/\//.test(href);
  const showArrow = href && !href.startsWith("#");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      {...props}
    >
      <span className="mdx-link-inner">
        {children}
        {showArrow && <LinkArrowIcon className="mdx-link-arrow" height="1em" />}
      </span>
    </a>
  );
}

export const mdxComponents = {
  a: ArrowLink,
  Callout,
};

/** Renders a compiled notes/prose component with the site's MDX components. */
export default function MdxContent({ Content, components }) {
  if (!Content) return null;
  return <Content components={{ ...mdxComponents, ...components }} />;
}
