import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/heebo/hebrew-400.css";
import "@fontsource/heebo/hebrew-500.css";
import "@fontsource/heebo/hebrew-600.css";
import "@fontsource/heebo/hebrew-700.css";
import "@fontsource/heebo/latin-400.css";
import "@fontsource/heebo/latin-600.css";
import "@fontsource/secular-one/hebrew-400.css";
import App from "./App.jsx";
import CancelApp from "./cancel/CancelApp.jsx";
import OwnerApp from "./owner/OwnerApp.jsx";
import "./styles.css";

const path = window.location.pathname;
const Root = path.startsWith("/owner")
  ? OwnerApp
  : path.startsWith("/cancel")
  ? CancelApp
  : App;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
