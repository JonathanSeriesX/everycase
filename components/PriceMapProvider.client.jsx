"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

// Maps a lowercased product kind (e.g. "bumper") to its per-currency price for
// the current page's model(s). Empty on pages that don't wrap content in
// <PricedSections>, so the h2 override falls back to a plain heading.
const PriceMapContext = createContext({});

export const PriceMapProvider = ({ value, children }) => (
  <PriceMapContext.Provider value={value || {}}>
    {children}
  </PriceMapContext.Provider>
);

export const usePriceMap = () => useContext(PriceMapContext);

// Tracks which model is currently selected per product kind, so a section
// heading can mirror the tab the reader picks below it. `model` may be a string
// or an array (a tab can cover several compatible models).
const ActiveModelContext = createContext({
  activeByKind: {},
  setActiveModel: () => {},
});

export const ActiveModelProvider = ({ children }) => {
  const [activeByKind, setMap] = useState({});

  const setActiveModel = useCallback((kind, model) => {
    if (!kind) return;
    const key = String(kind).toLowerCase();
    setMap((prev) => {
      if (JSON.stringify(prev[key]) === JSON.stringify(model)) return prev;
      return { ...prev, [key]: model };
    });
  }, []);

  const value = useMemo(
    () => ({ activeByKind, setActiveModel }),
    [activeByKind, setActiveModel],
  );

  return (
    <ActiveModelContext.Provider value={value}>
      {children}
    </ActiveModelContext.Provider>
  );
};

export const useActiveModels = () => useContext(ActiveModelContext);
