import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "../styles.css";
const rootNode = document.getElementById("root");
if (!rootNode) {
    throw new Error("LoopLot root element was not found in index.html.");
}
createRoot(rootNode).render(_jsx(StrictMode, { children: _jsx(BrowserRouter, { children: _jsx(App, {}) }) }));
