import { useMDXComponents as getThemeComponents } from "nextra-theme-docs"; // nextra-theme-blog or your custom theme
import { LinkArrowIcon } from "nextra/icons"; // same icon they use
import PricedHeading from "./components/PricedHeading.client";

// Get the default MDX components
const themeComponents = getThemeComponents();

// Merge components
export function useMDXComponents(components) {
  return {
    ...themeComponents,
    // Decorate section headings with price pills inside <PricedSections>;
    // outside it this falls back to the default heading.
    h2: PricedHeading,
    // Beautiful arrow after links
    a({ href = "", children, ...props }) {
      const showArrow = href && !href.startsWith("#");
      return (
        <themeComponents.a href={href} {...props}>
          <span className="inline-block whitespace-nowrap">
            {children}
            {showArrow && (
              <LinkArrowIcon
                className="inline align-baseline shrink-0"
                height="1em"
              />
            )}
          </span>
        </themeComponents.a>
      );
    },
    ...components,
  };
}
