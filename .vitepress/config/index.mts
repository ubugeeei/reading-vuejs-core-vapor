import { defineConfig } from "vitepress";
import sharedConfig from "./shared.mts";
import enConfig from "./en.mts";
import jaConfig from "./ja.mts";

export default defineConfig({
  ...sharedConfig(),
  locales: {
    root: { label: "English", lang: "en", ...enConfig() },
    ja: { label: "日本語", lang: "ja", ...jaConfig() },
  },
});
