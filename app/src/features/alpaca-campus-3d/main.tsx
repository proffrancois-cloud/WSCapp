import React, { Suspense, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const Campus3DApp = React.lazy(() =>
  import("./Campus3DApp").then((module) => ({ default: module.Campus3DApp }))
);

const root = document.getElementById("alpaca-campus-3d-root");

if (!root) {
  throw new Error("Missing #alpaca-campus-3d-root");
}

function getRequestedModeLabel(): string {
  const requestedMode = new URLSearchParams(window.location.search).get("mode");
  if (requestedMode === "multiplayer" || requestedMode === "online") {
    return "3D Campus Preview";
  }
  if (requestedMode === "local") {
    return "Local Campus";
  }
  return "Alpaca Campus 3D";
}

function CampusShellFallback(): React.ReactElement {
  const label = useMemo(getRequestedModeLabel, []);

  useEffect(() => {
    window.WSC_CAMPUS_3D_SHELL_VISIBLE = true;
    root?.setAttribute("data-campus-shell-visible", "true");
  }, []);

  return (
    <main className="campus3d-entry-shell" aria-label="Loading Alpaca Campus 3D">
      <section className="campus3d-entry-window">
        <div className="campus3d-entry-heading">
          <span className="campus3d-eyebrow">Alpaca Campus 3D</span>
          <h1>{label}</h1>
          <p className="campus3d-muted">Preparing the courtyard...</p>
        </div>
      </section>
    </main>
  );
}

createRoot(root).render(
  <React.StrictMode>
    <Suspense fallback={<CampusShellFallback />}>
      <Campus3DApp />
    </Suspense>
  </React.StrictMode>
);
