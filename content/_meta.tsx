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
  about: {
    title: "About ★",
    type: "page",
  },
  support: {
    title: "Support this ♥",
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
  /* sep3: {
    title: "Sorted by year:",
    type: "separator",
  },*/
  years: {
    title: "Years & Years",
    display: "hidden",
  },
};

export default config;
