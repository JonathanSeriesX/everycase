"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "./icons";
import chrome from "../styles/Chrome.module.css";

// The slice of Pagefind's API this box uses; the real module is generated
// post-build (see package.json postbuild) and served from public/_pagefind.
interface Pagefind {
  debouncedSearch(query: string): Promise<{
    results: { data(): Promise<PagefindDocument> }[];
  } | null>;
}

interface PagefindDocument {
  url: string;
  excerpt: string;
  meta?: { title?: string };
}

interface SearchResult {
  url: string;
  title: string;
  excerpt: string;
}

// The module is loaded lazily on first focus; in dev, where no index exists,
// the box degrades to a hint.
let pagefindPromise: Promise<Pagefind | null> | undefined;
function loadPagefind(): Promise<Pagefind | null> {
  if (!pagefindPromise) {
    pagefindPromise = (
      import(
        /* webpackIgnore: true */
        // @ts-expect-error — generated after `next build`; only exists at runtime
        "/_pagefind/pagefind.js"
      ) as Promise<Pagefind>
    ).catch(() => null);
  }
  return pagefindPromise;
}

const cleanUrl = (url: string): string =>
  url.replace(/\.html$/, "").replace(/\/index$/, "/") || "/";

export default function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null); // null = closed
  const [active, setActive] = useState(0);
  const [unavailable, setUnavailable] = useState(false);
  // On narrow viewports the box collapses to an icon and expands over the
  // navbar (covering the logo) when opened. Closing goes through a short
  // "closing" phase so the overlay animates out instead of vanishing.
  const [expanded, setExpanded] = useState(false);
  const [closing, setClosing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchId = useRef(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const expand = useCallback(() => {
    clearTimeout(closeTimer.current);
    setClosing(false);
    setExpanded(true);
  }, []);

  const collapse = useCallback(() => {
    setExpanded((wasExpanded) => {
      if (wasExpanded) {
        setClosing(true);
        clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => setClosing(false), 180);
      }
      return false;
    });
  }, []);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  const runSearch = useCallback(async (value: string) => {
    const id = ++searchId.current;
    if (!value.trim()) {
      setResults(null);
      return;
    }
    const pagefind = await loadPagefind();
    if (!pagefind) {
      setUnavailable(true);
      setResults([]);
      return;
    }
    const search = await pagefind.debouncedSearch(value);
    if (!search || id !== searchId.current) return;
    const data = await Promise.all(
      search.results.slice(0, 8).map((result) => result.data()),
    );
    if (id !== searchId.current) return;
    setActive(0);
    setResults(
      data.map((entry) => ({
        url: cleanUrl(entry.url),
        title: entry.meta?.title || cleanUrl(entry.url),
        excerpt: entry.excerpt,
      })),
    );
  }, []);

  // Close on outside click / Escape; focus with "/" or ⌘K.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setResults(null);
        collapse();
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setResults(null);
        collapse();
        inputRef.current?.blur();
      }
      const typingElsewhere =
        document.activeElement &&
        ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName);
      if (
        (event.key === "/" && !typingElsewhere) ||
        (event.key === "k" && (event.metaKey || event.ctrlKey))
      ) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [collapse]);

  const navigate = (url: string) => {
    setResults(null);
    setQuery("");
    collapse();
    router.push(url);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results || results.length === 0) {
      if (event.key === "Enter") runSearch(query);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => (current - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      navigate(results[active].url);
    }
  };

  return (
    <div
      className={chrome.search}
      data-expanded={expanded || undefined}
      data-closing={(closing && !expanded) || undefined}
      ref={containerRef}
    >
      <button
        type="button"
        className={`${chrome.iconButton} ${chrome.searchToggle}`}
        aria-label="Search"
        onClick={expand}
      >
        <SearchIcon />
      </button>
      <div className={chrome.searchField}>
        <SearchIcon className={chrome.searchIcon} aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          className={chrome.searchInput}
          placeholder="Search by colour or SKU..."
          aria-label="Search"
          value={query}
          onFocus={() => loadPagefind()}
          onChange={(event) => {
            setQuery(event.target.value);
            runSearch(event.target.value);
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      {results !== null && (
        <div className={chrome.searchResults}>
          {results.length === 0 ? (
            <p className={chrome.searchEmpty}>
              {unavailable
                ? "Search index not built (production only)."
                : "No results."}
            </p>
          ) : (
            results.map((result, index) => (
              <a
                key={result.url}
                href={result.url}
                className={chrome.searchResult}
                data-active={index === active}
                onClick={(event) => {
                  event.preventDefault();
                  navigate(result.url);
                }}
                onMouseEnter={() => setActive(index)}
              >
                <div className={chrome.searchResultTitle}>{result.title}</div>
                <div
                  className={chrome.searchResultExcerpt}
                  dangerouslySetInnerHTML={{ __html: result.excerpt }}
                />
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}
