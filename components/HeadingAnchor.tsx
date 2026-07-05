import { LinkArrowIcon } from "./icons";

/**
 * Permalink for a heading: an ↗ arrow that sits invisibly after the title and
 * fades in when the heading is hovered (faintly at rest on touch, where there
 * is no hover). The reveal/dismiss styling lives in globals.css under
 * `.subheading-anchor`; HashNavigation.client.tsx keeps clicks on it out of
 * the Back stack and hides it after a tap on touch devices.
 */
export default function HeadingAnchor({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  return (
    <a
      href={`#${id}`}
      className="subheading-anchor"
      aria-label={`Link to “${title}”`}
    >
      <LinkArrowIcon aria-hidden="true" />
    </a>
  );
}
