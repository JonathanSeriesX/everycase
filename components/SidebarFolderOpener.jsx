"use client";

import { useEffect } from "react";

// Case pages live at /case/[sku], outside Nextra's content tree, so the sidebar
// can't tell which device folder they belong to and renders everything
// collapsed (worst on a hard refresh or a direct Google landing). We nudge
// Nextra's *own* folder toggle open for the matching category by clicking its
// button when it's collapsed — that routes through Nextra's state (TreeState),
// so it persists for the session and survives client-side navigation. Scoped to
// case pages; every other page keeps its default collapse behaviour.
export default function SidebarFolderOpener({ categoryRoute }) {
  useEffect(() => {
    if (!categoryRoute) return;

    let frame;
    let tries = 0;

    const openFolder = () => {
      // Folder headers (directories without their own page) render as buttons
      // carrying data-href; anchors are skipped so we never trigger navigation.
      const buttons = document.querySelectorAll(
        `button[data-href="${categoryRoute}"]`,
      );

      if (buttons.length === 0) {
        // The sidebar may not have mounted yet — retry for a few frames.
        if (tries++ < 30) frame = requestAnimationFrame(openFolder);
        return;
      }

      buttons.forEach((button) => {
        const li = button.closest("li");
        // Only open when collapsed; clicking an open folder would close it.
        if (li && !li.classList.contains("open")) button.click();
      });
    };

    openFolder();
    return () => cancelAnimationFrame(frame);
  }, [categoryRoute]);

  return null;
}
