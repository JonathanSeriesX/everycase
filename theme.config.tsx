import React from "react";
import type { DocsThemeConfig } from "nextra-theme-docs";
import { useConfig } from "nextra-theme-docs";
import { useRouter } from "next/router";

const logo = (
  <>
    <span
      style={{
        fontFamily: '"Quicksand", system-ui',
        fontSize: "26px",
        letterSpacing: "0px",
        fontWeight: 300,
        marginRight: -5,
      }}
    >
      FineWoven
    </span>
    <picture>
      <img
        src="/icons/icon-512x512.png"
        alt="FineWoven Empire Logo"
        className="logo"
      />
    </picture>
    <span
      style={{
        fontFamily: '"Quicksand", system-ui',
        fontSize: "26px",
        letterSpacing: "0px",
        fontWeight: 300,
        marginLeft: -10,
        marginRight: 15,
      }}
    >
      Empire
    </span>
  </>
);

const config: DocsThemeConfig = {
  i18n: [
    // { locale: 'en-GB', text: 'English' },
    // { locale: 'ar-SA', text: 'العربية', direction: 'rtl' }
  ],
  project: {
    // GitHub link; will spawn it in the title bar
    //link: 'https://github.com/Jonathunky/everyfruitcase',
    //TODO make it show up only on desktop?
  },
  chat: {
    //link: 'https://discord.com',
    //supports icons
  },
  logo,
  docsRepositoryBase: "https://github.com/Jonathunky/everyfruitcase/tree/main/",
  footer: {
    //text: "Yeah",
    component: undefined,
  },
  sidebar: {
    titleComponent({ title, type }) {
      const boldTitles = [
        "Latest iPhone",
        "Latest iPad",
        "Other stuff",
        "Pre-MagSafe iPhone",
        "Pre-notch iPhone",
        "Pre-Liquid iPad",
        "Ancient History"
      ];
      if (boldTitles.includes(title)) {
        return <span className="folder-name">{title}</span>;
      }
      return <>{title}</>;
    },
    defaultMenuCollapseLevel: 2,
    toggleButton: true,
    autoCollapse: false
  },
  //gitTimestamp: () => <></>,
  darkMode: true,
  nextThemes: {
    defaultTheme: 'system'
  },
  primaryHue: {
    light: 10,
    dark: 10
  },
  primarySaturation: {
    light: 100,
    dark: 100
  },
  useNextSeoProps() {
    const { asPath } = useRouter();
    var titleTemplate;
    if (asPath !== '/') {
      titleTemplate = '%s — FineWoven Empire'
      return {
        titleTemplate
      }
    } else {
      titleTemplate = 'FineWoven Empire'
      return {
        titleTemplate
      };
    }
  },
  toc: {
    float: true,
    backToTop: true,
  },
  feedback: {
    content: "Leave feedback →",
  },
  editLink: {
    text: "Propose edits on GitHub →",
  },
  navigation: {
    prev: false,
    next: false
  },
  head: function Head() {
    const { title } = useConfig();
    const router = useRouter();
    const { asPath } = useRouter();

    const baseURL = "https://everycase.org";
    const currentURL = `${baseURL}${router.asPath}`;

    var titleTemplate;
    if (asPath !== '/') {
      titleTemplate = title + ' — FineWoven Empire'
    } else {
      titleTemplate = 'FineWoven Empire'
    }

    return (
      <>
        <link rel="preload” href=”/fonts/TofinoVariable.woff2" as="font" type="font/woff2" />
        {/* Basic Information */}
        <link rel="icon" href="/icons/android-chrome-512x512.png" type="image/png" sizes="512x512" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#E3504F" />
        <meta name="application-name" content="FineWoven Empire" />
        <meta name="description" content="Library of Apple cases for iPhone, iPad, and Mac." />

        {/* OpenGraph Tags */}
        <meta property="og:type" content="website" />
        {/* <meta property="og:title" content={title ? title : "EveryCase"} /> — managed by NextSeo plugin*/}

        <meta property="og:description" content="Library of Apple cases for iPhone, iPad, and Mac." />
        <meta property="og:image" content="https://everycase.org/icons/back.jpg" />
        <meta property="og:url" content={currentURL} />
        <meta property="og:locale" content="en_GB" />

        {/* Twitter Tags */}
        <meta name="twitter:image" content="https://everycase.org/icons/back.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content="@Jonathunky"></meta>
        <meta name="twitter:title" content={titleTemplate} />
        <meta name="twitter:description" content="Library of Apple cases for iPhone, iPad, and Mac." />

        {/* Apple Specific Tags */}
        <meta name="apple-mobile-web-app-title" content="FineWoven Empire" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#E3504F" />

        {/* Microsoft Specific Tags */}
        <meta name="msapplication-config" content="none" />
        <meta name="msapplication-TileColor" content="#FFE0F5" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Miscellaneous */}
        {/* <meta name="robots" content="noindex" /> also managed by plugin */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
      </>
    );
  },
  search: {
    placeholder: "Search...",
  },
};

export default config;
