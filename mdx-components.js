import { useMDXComponents as getThemeComponents } from "nextra-theme-docs"; // nextra-theme-blog or your custom theme
import { LinkArrowIcon } from "nextra/icons"; // same icon they use

// Get the default MDX components
const themeComponents = getThemeComponents();

// Merge components
export function useMDXComponents(components) {
  return {
    ...themeComponents,
    // Beautiful arrow after links
    a({ href = "", children, ...props }) {
      const showArrow = href && !href.startsWith("#");
      return (
        <themeComponents.a href={href} {...props}>
          {children}
          {showArrow && (
            <>
              <LinkArrowIcon
                className="inline align-baseline shrink-0"
                height="1em"
              />
            </>
          )}
        </themeComponents.a>
      );
    },
    ...components,
  };
}
