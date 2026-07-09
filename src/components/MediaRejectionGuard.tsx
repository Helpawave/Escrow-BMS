import { useEffect } from "react";

export function MediaRejectionGuard() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const reason: unknown = event.reason;
      const name =
        typeof (reason as { name?: unknown } | null)?.name === "string" ? (reason as { name: string }).name : "";
      const message =
        typeof (reason as { message?: unknown } | null)?.message === "string"
          ? (reason as { message: string }).message
          : "";
      const text = `${name} ${message}`.toLowerCase();

      if (
        name === "AbortError" ||
        text.includes("play() request was interrupted") ||
        text.includes("media was removed from the document")
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  return null;
}
