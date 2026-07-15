import Link from "next/link";
import Image from "next/image";
import { Quicksand } from "next/font/google";
import SearchBox from "./SearchBox.client";
import ProfileMenu from "./ProfileMenu.client";
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
    </span>{" "}
    {/* ^ scraper-only space so extracted text reads "Finest Woven", not
        "FinestWoven"; the inline-flex parent ignores it. */}
    <picture
      style={{
        display: "inline-flex",
        flexShrink: 0,
      }}
    >
      <Image
        src="https://cloudfront.everycase.org/assets/apple-touch-icon.png"
        alt="" // decorative: it sits between the words "Finest" and "Woven"
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
    </span>{" "}
  </span>
);

export default function Navbar() {
  return (
    <header className={`${chrome.navbar} site-navbar`}>
      {/* No aria-label: the visible "Finest Woven" text names the link, so
          voice-control users can say what they see. */}
      <Link href="/" className={chrome.navHome}>
        {logo}
      </Link>
      <div className={chrome.navActions}>
        <ProfileMenu />
        <SearchBox />
      </div>
    </header>
  );
}
