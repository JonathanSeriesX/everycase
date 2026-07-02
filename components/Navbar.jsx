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

const wordStyle = {
  fontSize: "26px",
  fontWeight: 300,
};

export default function Navbar() {
  return (
    <header className={`${chrome.navbar} site-navbar`}>
      <Link href="/" className={chrome.navHome} aria-label="Finest Woven — home">
        <span className={quicksand.className} style={{ ...wordStyle, marginRight: -5 }}>
          Finest
        </span>
        <Image
          src="https://cloudfront.everycase.org/assets/apple-touch-icon.png"
          alt=""
          width={48}
          height={48}
          priority
          unoptimized
        />
        <span className={quicksand.className} style={{ ...wordStyle, marginLeft: -10 }}>
          Woven
        </span>
      </Link>
      <div className={chrome.navActions}>
        <SearchBox />
        <ThemeToggle />
      </div>
    </header>
  );
}
