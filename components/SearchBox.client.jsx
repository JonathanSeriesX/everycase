"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "./icons";
import chrome from "../styles/Chrome.module.css";

// Pagefind is generated post-build (see package.json postbuild) and served
// from public/_pagefind. The module is loaded lazily on first focus; in dev,
// where no index exists, the box degrades to a hint.
let pagefindPromise;
function loadPagefind() {
  if (!pagefindPromise) {
    pagefindPromise = import(
      /* webpackIgnore: true */ "/_pagefind/pagefind.js"
    ).catch(() => null);
  }
  return pagefindPromise;
}

const cleanUrl = (url) =>
  url.replace(/\.html$/, "").replace(/\/index$/, "/") || "/";

export default function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null); // null = closed
  const [active, setActive] = useState(0);
  const [unavailable, setUnavailable] = useState(false);
  // On narrow viewports the box collapses to an icon and expands over the
  // navbar (covering the logo) when opened.
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const searchId = useRef(0);

  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  const runSearch = useCallback(async (value) => {
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
    const onClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setResults(null);
        setExpanded(false);
      }
    };
    const onKey = (event) => {
      if (event.key === "Escape") {
        setResults(null);
        setExpanded(false);
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
  }, []);

  const navigate = (url) => {
    setResults(null);
    setQuery("");
    setExpanded(false);
    router.push(url);
  };

  const onKeyDown = (event) => {
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
      ref={containerRef}
    >
      <button
        type="button"
        className={`${chrome.iconButton} ${chrome.searchToggle}`}
        aria-label="Search"
        onClick={() => setExpanded(true)}
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
