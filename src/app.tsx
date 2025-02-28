import * as React from "react";
import { ErrorBoundary } from "./errorboundary";
import { AppCore } from "./appcore";

export type RenderMode = "svg" | "canvas" | "data-url";

export function App() {
  const icon = React.useMemo(() => {
    const favicon = document.getElementsByTagName("link")[0];
    return favicon ? favicon.href : "";
  }, []);

  return (
    <div
      style={{
        display: "flex",
        width: "calc(min(90vw, 70vh) + 2rem)",
        margin: "1rem auto",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      <h1
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "0.5rem",
          alignItems: "center",
        }}
      >
        <img
          src={icon}
          style={{ imageRendering: "pixelated", height: "2rem" }}
        />{" "}
        QR Code&trade; Generator
      </h1>
      <ErrorBoundary
        fallback={(error) => {
          return (
            <>
              <h2>Error</h2>
              <div>
                <span>There was a problem generating a qrcode</span>
                <span>
                  {error instanceof Error
                    ? `: ${error.message}`
                    : `: ${error ?? "unknown error"}`}
                </span>
              </div>
              <div>
                <button
                  onClick={() => location.reload()}
                  style={{ padding: "0.25rem 1rem", marginLeft: "auto" }}
                >
                  Retry
                </button>
              </div>
            </>
          );
        }}
      >
        <AppCore />
      </ErrorBoundary>
      <div>
        Built using{" "}
        <a href="https://github.com/pollrobots/qrts" target="_blank">
          qrts
        </a>
      </div>
    </div>
  );
}
