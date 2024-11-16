import React from "react";
import { useConfig } from "nextra-theme-docs";
import { useRouter } from "next/router";
import { Quicksand } from "next/font/google";

const quicksand = Quicksand({ subsets: ["latin"], weight: ["300", "400"] });

const logo = (
  <>
    <span
      className={quicksand.className} // Apply the Quicksand font
      style={{
        fontSize: "26px",
        letterSpacing: "0px",
        fontWeight: 300,
        marginRight: -5
      }}
    >
      Finest
    </span>
    <picture>
      <img
        src="/icons/icon-512x512.png"
        alt="Finest Woven Logo"
        className="logo"
      />
    </picture>
    <span
      className={quicksand.className}
      style={{
        fontSize: "26px",
        letterSpacing: "0px",
        fontWeight: 300,
        marginLeft: -10,
        marginRight: 15
      }}
    >
      Woven
    </span>
  </>
);

function Head() {
  const { title } = useConfig();
  const router = useRouter();
  const { asPath } = useRouter();

  const baseURL = "https://everycase.org";
  const currentURL = `${baseURL}${router.asPath}`;

  let titleTemplate;
  if (asPath !== "/") {
    titleTemplate = title + " — Finest Woven";
  } else {
    titleTemplate = "Finest Woven";
  }

  return (
    <>
      <title>{titleTemplate}</title>
      <link
        rel="icon"
        href="/icons/android-chrome-512x512.png"
        type="image/png"
        sizes="512x512"
      />
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#E3504F" />
      <meta name="application-name" content="Finest Woven" />
      <meta
        name="description"
        content="Library of Apple cases for iPhone, iPad, and Mac."
      />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={titleTemplate} />

      <meta
        property="og:description"
        content="Library of Apple cases for iPhone, iPad, and Mac."
      />
      <meta
        property="og:image"
        content={`${baseUrl}/api/og-image?page=${router.asPath}`}
      />
      <meta property="og:url" content={currentURL} />
      <meta property="og:locale" content="en_GB" />

      {/* Twitter Tags */}
      <meta
        name="twitter:image"
        content="https://everycase.org/icons/back.jpg"
      />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content="@Jonathunky"></meta>
      <meta name="twitter:title" content={titleTemplate} />
      <meta
        name="twitter:description"
        content="Library of Apple cases for iPhone, iPad, and Mac."
      />

      {/* Apple Specific Tags */}
      <meta name="apple-mobile-web-app-title" content="Finest Woven" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/icons/apple-touch-icon.png"
      />
      <link
        rel="mask-icon"
        href="/icons/safari-pinned-tab.svg"
        color="#E3504F"
      />

      {/* Microsoft Specific Tags */}
      <meta name="msapplication-config" content="none" />
      <meta name="msapplication-TileColor" content="#FFE0F5" />
      <meta name="msapplication-tap-highlight" content="no" />

      {/* Miscellaneous */}
      <meta name="robots" content="index, follow" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
    </>
  );
}

const config = {
  project: {
    //link: 'https://github.com/JonathanSeriesX/everycase',
  },
  search: {
    placeholder: "Search by color or SKU..."
  },
  logo: logo,
  docsRepositoryBase: "https://github.com/JonathanSeriesX/everycase/tree/main",
  footer: {
    component: undefined
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
    autoCollapse: false
  },
  darkMode: true,
  nextThemes: {
    defaultTheme: "system"
  },
  color: {
    hue: {
      light: 10,
      dark: 10
    },
    saturation: {
      light: 100,
      dark: 100
    }
  },
  toc: {
    float: true,
    backToTop: true
  },
  feedback: {
    //content: "Leave feedback →"
    content: false
  },
  editLink: {
    content: "Suggest edits →"
  },
  navigation: {
    prev: false,
    next: false
  },
  head: Head,
  notFound: {
    content: "We've moved things around. Please go to start page!"
  }
};

export default config;
