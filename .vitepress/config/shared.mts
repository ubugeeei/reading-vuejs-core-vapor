import type { DefaultTheme, UserConfig } from "vitepress";
import { previewGitHubSource } from "../plugins/markdown-it/github";

export default (): UserConfig<DefaultTheme.Config> => ({
  srcDir: "src",
  themeConfig: {
    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },
  markdown: {
    config: (md) => {
      md.use(previewGitHubSource);
    },
  },
  head: [
    ["link", { rel: "stylesheet", href: "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/base16/circus.css" }],
  ],
});
