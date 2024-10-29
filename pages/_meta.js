export default {
  '*': {
    theme: {
      pagination: false,
      toc: true,
    },
  },
  index: {
    title: '🏡 Home',
    theme: {
      breadcrumb: true,
      typesetting: 'article',
      footer: false,
      sidebar: true,
      toc: false,
      pagination: false,
      layout: 'full',
    },
    display: 'hidden',
  },
  about: {
    title: 'Credits ★',
    type: 'page',
  },
  support: {
    title: 'Leave your mark ♥',
    type: 'page',
  },
  sep1: {
    title: 'Sorted by device:',
    type: 'separator',
  },
  'latest-iphone': {
    title: 'Latest iPhone',
    theme: {
      collapsed: false,
    },
  },
  'latest-ipad': {
    title: 'Latest iPad',
    theme: {
      collapsed: false,
    },
  },
  others: {
    title: 'Other stuff',
    theme: {
      collapsed: true,
    },
  },
  'pre-magsafe-iphone': {
    title: 'Pre-MagSafe iPhone',
    theme: {
      collapsed: true,
    },
  },
  'pre-notch-iphone': {
    title: 'Pre-notch iPhone',
    theme: {
      collapsed: true,
    },
  },
  'pre-liquid-ipad': {
    title: 'Pre-Liquid iPad',
    theme: {
      collapsed: true,
    },
  },
  ancient: {
    title: 'Ancient History',
    theme: {
      collapsed: true,
    },
    collapsed: true,
  },
  sample: {
    title: 'Test',
    theme: {
      collapsed: true,
    },
    display: 'hidden',
  },
}
