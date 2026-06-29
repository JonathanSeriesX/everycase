"use client";

import { useEffect } from "react";

// Makes the sidebar's top-level folders behave like an accordion: opening one
// (iPhone, iPad, Others …) collapses any other that's open. Nextra has no such
// option, so we watch the sidebar for a folder gaining its "open" class and
// close the siblings. A MutationObserver (rather than a click listener) catches
// both user clicks and programmatic opens — e.g. SidebarFolderOpener on case
// pages — without depending on listener-attachment timing.
export default function SidebarAccordion() {
  useEffect(() => {
    // A top-level folder is an <li> whose first child is the toggle button
    // (directories without their own page render as button[data-href]).
    const folderButtonOf = (li) => {
      const el = li.firstElementChild;
      return el && el.tagName === "BUTTON" && el.hasAttribute("data-href")
        ? el
        : null;
    };

    const closeSiblings = (openedLi) => {
      const sidebar = openedLi.closest(".nextra-sidebar");
      if (!sidebar) return;
      sidebar.querySelectorAll("li.open").forEach((li) => {
        if (li === openedLi) return;
        const button = folderButtonOf(li);
        // Clicking an open folder's toggle collapses it via Nextra's own state.
        if (button) button.click();
      });
    };

    let frame;
    let observer;

    const start = () => {
      const sidebars = document.querySelectorAll(".nextra-sidebar");
      if (sidebars.length === 0) {
        frame = requestAnimationFrame(start);
        return;
      }

      observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          const li = mutation.target;
          if (
            li instanceof HTMLElement &&
            li.tagName === "LI" &&
            li.classList.contains("open") &&
            folderButtonOf(li)
          ) {
            closeSiblings(li);
            break;
          }
        }
      });

      sidebars.forEach((sidebar) =>
        observer.observe(sidebar, {
          subtree: true,
          attributes: true,
          attributeFilter: ["class"],
        }),
      );
    };

    start();

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, []);

  return null;
}
