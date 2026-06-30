"use client";

import { useEffect } from "react";
import { useActiveModels } from "./PriceMapProvider.client";

/**
 * Thin client wrapper around a <CaseTableTabs> tab group. It does not control
 * the tabs — Nextra's <Tabs> keeps owning selection and persisting it to
 * localStorage under `storageKey`. We just observe that key (read it on mount,
 * then listen for the `storage` event Nextra dispatches on every change) and
 * publish the selected tab's model into ActiveModel context, so the matching
 * section heading can show that model's exact price.
 *
 * @param {Object} props
 * @param {string} props.storageKey - The Tabs storageKey to observe.
 * @param {string} props.sectionKind - Product kind this section maps to.
 * @param {Array<string|string[]|null>} props.tabModels - Model per tab index.
 * @param {React.ReactNode} props.children - The rendered <Tabs> tree.
 */
const CaseTabsObserver = ({ storageKey, sectionKind, tabModels, children }) => {
  const { setActiveModel } = useActiveModels();
  const modelsKey = JSON.stringify(tabModels);

  useEffect(() => {
    const models = JSON.parse(modelsKey);
    const apply = (index) => {
      const i = Number.isInteger(index) && index >= 0 && index < models.length ? index : 0;
      setActiveModel(sectionKind, models[i]);
    };

    if (!storageKey) {
      apply(0);
      return;
    }

    const stored = Number(localStorage.getItem(storageKey));
    apply(Number.isNaN(stored) ? 0 : stored);

    const onStorage = (event) => {
      if (event.key !== storageKey) return;
      const next = Number(event.newValue);
      apply(Number.isNaN(next) ? 0 : next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey, sectionKind, modelsKey, setActiveModel]);

  return children;
};

export default CaseTabsObserver;
