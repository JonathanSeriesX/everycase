"use client";

import { useState } from "react";
import VerticalCarouselClient from "./VerticalCarousel.client";
import chrome from "../styles/Chrome.module.css";

/**
 * Case cards for one kind. A single model renders as a plain grid; several
 * models get a pill tab bar. All panels are in the static HTML — switching
 * tabs only toggles visibility, so nothing refetches.
 */
export default function ModelTabs({ kind, models }) {
  const [active, setActive] = useState(0);
  if (!models || models.length === 0) return null;

  return (
    <div>
      {models.length > 1 && (
        <div role="tablist" aria-label={`${kind} by model`} className={chrome.tabList}>
          {models.map((entry, index) => (
            <button
              key={entry.model}
              role="tab"
              type="button"
              aria-selected={index === active}
              data-active={index === active}
              className={chrome.tab}
              onClick={(e) => {
                setActive(index);
                e.currentTarget.blur();
              }}
            >
              {entry.model}
            </button>
          ))}
        </div>
      )}
      {models.map((entry, index) => (
        <div key={entry.model} role="tabpanel" hidden={index !== active}>
          <VerticalCarouselClient
            cases={entry.cases}
            model={entry.model}
            material={kind}
            standalone={models.length === 1}
          />
        </div>
      ))}
    </div>
  );
}
