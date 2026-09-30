import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Workbench } from "./app/workbench/Workbench";
import "./styles/global.css";

const root = document.getElementById("root");
if (!root) throw new Error("Application root is unavailable.");

createRoot(root).render(
  <StrictMode>
    <Workbench />
  </StrictMode>,
);
