"use client";

import { useEffect } from "react";

// Posílá výšku obsahu rodičovskému oknu přes postMessage.
// Rodič si poslech řeší sám (dokumentace na /embed-docs v M6).
// Formát zprávy: { type: "padel-resize", height: <number>, path: <string> }
export function IframeAutoresize() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.parent === window) return; // Neběží v iframu

    const post = () => {
      const height = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
      );
      window.parent.postMessage(
        { type: "padel-resize", height, path: window.location.pathname },
        "*",
      );
    };

    post();

    const ro = new ResizeObserver(() => post());
    ro.observe(document.documentElement);

    const mo = new MutationObserver(() => post());
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    window.addEventListener("load", post);

    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("load", post);
    };
  }, []);

  return null;
}
