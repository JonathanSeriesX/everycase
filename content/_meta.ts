const config = {
  "*": {
    theme: {
      pagination: false,
      toc: false,
      layout: "full",
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
    title: "Roadmap ➤",
    type: "page",
  },
  about: {
    title: "Credits ★",
    type: "page",
  },
  support: {
    title: "Leave your mark ♥",
    type: "page",
  },
  sep1: {
    title: "Sorted by device:",
    type: "separator",
  },
  iphone: {
    title: "iPhone",
  },
  sep2: {
    title: "Under construction:",
    type: "separator",
  },
  ipad: {
    title: "iPad",
  },
  others: {
    title: "Others",
  },
  trash: {
    title: "Trash",
    display: "hidden",
  },
};

export default config;
