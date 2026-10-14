"use client";

import { useEffect } from "react";

/**
 * Warns before leaving a page with unsaved edits: browser unload/refresh, and in-app link clicks
 * (the App Router has no route-change events, so internal anchors are intercepted).
 */
export function useUnsavedWarning(dirty: boolean): void {
  useEffect(() => {
    if (!dirty) return;
    const message = "You have unsaved changes. Leave without saving?";

    const onBeforeUnload = (e: BeforeUnloadEvent): void => {
      // preventDefault is enough in current browsers to trigger the native confirmation.
      e.preventDefault();
    };
    const onClick = (e: MouseEvent): void => {
      const a = (e.target as Element | null)?.closest("a[href]");
      if (!a || a.getAttribute("target") === "_blank" || e.defaultPrevented) return;
      const href = a.getAttribute("href") ?? "";
      if (!href.startsWith("/") && !href.startsWith("#")) return;
      if (!window.confirm(message)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);
}
