"use client";

import { createContext, useContext } from "react";

// Maps a lowercased product kind (e.g. "bumper") to its per-currency price for
// the current page's model. Empty on pages that don't wrap content in
// <PricedSections>, so the h2 override falls back to a plain heading.
const PriceMapContext = createContext({});

export const PriceMapProvider = ({ value, children }) => (
  <PriceMapContext.Provider value={value || {}}>
    {children}
  </PriceMapContext.Provider>
);

export const usePriceMap = () => useContext(PriceMapContext);
