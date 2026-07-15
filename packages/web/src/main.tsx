import { render } from "preact";
import { App } from "./app";
import "./styles.css";

const el = document.getElementById("app");
if (!el) throw new Error("#app not found");
render(<App />, el);
