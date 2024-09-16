import type { DefaultTheme, UserConfig } from "vitepress";
import { previewGitHubSource } from "../plugins/markdown-it/github";

export default (): UserConfig<DefaultTheme.Config> => ({
  srcDir: "src",
  themeConfig: {
    i18nRouting: true,
    logo: "/logo.png",
    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/ubugeeei/reading-vuejs-core-vapor",
      },
    ],
    search: { provider: "local" },
    outline: "deep",
    footer: {
      copyright: `© 2024-PRESENT ubugeeei All rights reserved.`,
    },
  },
  markdown: {
    config: (md) => {
      md.use(previewGitHubSource);
    },
  },
  head: [
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/base16/circus.css",
      },
    ],
    [
      "link",
      {
        rel: "icon",
        href: "/logo.png",
      },
    ],
  ],
});
