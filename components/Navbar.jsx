import Link from "next/link";
import Image from "next/image";
import { Quicksand } from "next/font/google";
import SearchBox from "./SearchBox.client";
import ThemeToggle from "./ThemeToggle.client";
import chrome from "../styles/Chrome.module.css";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-quicksand",
});

// The logo markup and metrics are deliberate — keep them exactly as they were.
const logo = (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      flexShrink: 0,
      whiteSpace: "nowrap",
    }}
  >
    <span
      className={quicksand.className} // Apply the Quicksand font
      style={{
        fontSize: "26px",
        letterSpacing: "0px",
        fontWeight: 300,
        marginRight: -5,
      }}
    >
      Finest
    </span>
    <picture
      style={{
        display: "inline-flex",
        flexShrink: 0,
      }}
    >
      <Image
        src="https://cloudfront.everycase.org/assets/apple-touch-icon.png"
        alt="Finest Woven Logo"
        width={48}
        height={48}
        style={{
          marginTop: "0px",
          marginRight: "4px",
          height: "48px",
          width: "48px",
        }}
      />
    </picture>
    <span
      className={quicksand.className}
      style={{
        fontSize: "26px",
        letterSpacing: "0px",
        fontWeight: 300,
        marginLeft: -10,
        marginRight: 15,
      }}
    >
      Woven
    </span>
  </span>
);

export default function Navbar() {
  return (
    <header className={`${chrome.navbar} site-navbar`}>
      <Link href="/" className={chrome.navHome} aria-label="Finest Woven — home">
        {logo}
      </Link>
      <div className={chrome.navActions}>
        <SearchBox />
        <ThemeToggle />
      </div>
    </header>
  );
}
