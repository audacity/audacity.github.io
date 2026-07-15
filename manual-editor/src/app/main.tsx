import { createRoot } from "react-dom/client";
import { App } from "./App";
import { AuthGate } from "./AuthGate";
import "./editor.css";

createRoot(document.getElementById("root")!).render(
  <AuthGate>{(user) => <App user={user} />}</AuthGate>,
);
