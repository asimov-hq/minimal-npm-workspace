import { hello } from "@my-app/shared";

const el = document.getElementById("app");
if (!el) throw new Error("#app not found");

el.textContent = `[web] ${hello("world")}`;