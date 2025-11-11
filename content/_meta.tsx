import { GitHubIcon } from "nextra/icons";

const config = {
  "*": {
    theme: {
      pagination: false,
      toc: false,
      layout: "full",
      timestamp: false,
    },
  },
  index: {
    title: "🏡 Home",
    theme: {
      breadcrumb: false,
      typesetting: "article",
      footer: false,
      sidebar: true,
      toc: false,
      pagination: false,
      layout: "full",
    },
    display: "hidden",
  },
  why: {
    title: "Why? ✦",
    type: "page",
  },
  roadmap: {
    title: (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          whiteSpace: "nowrap",
        }}
      >
        Roadmap
        <GitHubIcon
          aria-hidden
          style={{
            width: 16,
            height: 16,
            display: "inline-block",
            verticalAlign: "middle",
          }}
        />
      </span>
    ),
    href: "https://github.com/JonathanSeriesX/everycase#readme",
    type: "page",
  },
  about: {
    title: "Credits ★",
    type: "page",
  },
  support: {
    title: "Support me ♥",
    type: "page",
  },
  sep1: {
    title: "Sorted by device:",
    type: "separator",
  },
  iphone: {
    title: "iPhone",
  },
  ipad: {
    title: "iPad",
  },
  sep2: {
    title: "Under construction:",
    type: "separator",
  },
  others: {
    title: "Others",
  },
};

export default config;
