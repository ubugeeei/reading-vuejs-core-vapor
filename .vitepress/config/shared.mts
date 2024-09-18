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
    lastUpdated: {
      text: "Updated at",
      formatOptions: {
        dateStyle: "full",
        timeStyle: "medium",
      },
    },
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
    ["link", { rel: "icon", href: "/logo.png" }],

    // og
    ["meta", { property: "og:site_name", content: "Reading vuejs/core-vapor" }],
    [
      "meta",
      {
        property: "og:url",
        content: "https://ubugeeei.github.io/reading-vuejs-core-vapor",
      },
    ],
    ["meta", { property: "og:title", content: "Reading vuejs/core-vapor" }],
    [
      "meta",
      {
        property: "og:description",
        content: "Reading vuejs/core-vapor",
      },
    ],
    [
      "meta",
      {
        property: "og:image",
        content:
          "https://github.com/ubugeeei/reading-vuejs-core-vapor/blob/main/src/public/cover.png?raw=true",
      },
    ],
    ["meta", { property: "og:image:alt", content: "Reading vuejs/core-vapor" }],
    ["meta", { name: "twitter:site", content: "Reading vuejs/core-vapor" }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:title", content: "Reading vuejs/core-vapor" }],
    [
      "meta",
      { name: "twitter:description", content: "Reading vuejs/core-vapor" },
    ],
    [
      "meta",
      {
        name: "twitter:image",
        content:
          "https://github.com/ubugeeei/reading-vuejs-core-vapor/blob/main/src/public/cover.png?raw=true",
      },
    ],
    [
      "meta",
      { name: "twitter:image:alt", content: "Reading vuejs/core-vapor" },
    ],
  ],
});
