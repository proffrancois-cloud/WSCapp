import React from "react";
import { createRoot } from "react-dom/client";
import { Campus3DApp } from "./Campus3DApp";
import "./styles.css";

const root = document.getElementById("alpaca-campus-3d-root");

if (!root) {
  throw new Error("Missing #alpaca-campus-3d-root");
}

createRoot(root).render(
  <React.StrictMode>
    <Campus3DApp />
  </React.StrictMode>
);
